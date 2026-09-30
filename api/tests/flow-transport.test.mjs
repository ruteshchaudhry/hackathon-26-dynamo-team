import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlowTransport } from '../lib/flow-transport.mjs';
import { readConfig } from '../lib/config.mjs';

const config = { siteId: 'demo-site', stagingListId: 'staging-id', addedListId: 'added-id', flowUrl: 'https://demo.environment.api.powerplatform.com/trigger?sig=private-key' };
const root = 'https://graph.microsoft.com/v1.0/sites/demo-site/lists/';
const row = { Id: 7, 'odata.etag': '"3"', Email: 'alex@example.com' };
const response = (body, status = 200) => ({ ok: true, json: async () => ({ status, body }) });

test('flow reads translate filters and preserve record versions without Graph credentials', async () => {
  let payload;
  const request = createFlowTransport(config, async (url, options) => {
    assert.equal(url, config.flowUrl); assert.equal(options.headers.Authorization, undefined);
    payload = JSON.parse(options.body); return response({ value: [row] });
  });
  const result = await request(`${root}added-id/items?${new URLSearchParams({ '$expand': 'fields', '$filter': "fields/CandidateKey eq 'o''neil@example.com'" })}`);
  assert.equal(new URLSearchParams(payload.query).get('$filter'), "CandidateKey eq 'o''neil@example.com'");
  assert.equal(payload.list, 'added'); assert.equal(payload.operation, 'list');
  assert.deepEqual(result.value, [{ id: '7', eTag: '"3"', fields: { Id: 7, Email: 'alex@example.com' } }]);
});

test('writes carry exact versions and only allow intended list operations', async () => {
  const calls = [];
  const request = createFlowTransport(config, async (_, options) => { calls.push(JSON.parse(options.body)); return response({}, 204); });
  await request(`${root}staging-id/items/7/fields`, 'PATCH', { FirstName: 'Alex' }, '"3"');
  assert.equal(calls[0].eTag, '"3"'); assert.equal(calls[0].operation, 'update');
  await request(`${root}staging-id/items/7`, 'DELETE', undefined, '"4"');
  assert.equal(calls[1].eTag, '"4"');
  for (const args of [
    [`${root}staging-id/items/7`, 'DELETE', undefined, '*'],
    [`${root}added-id/items/7`, 'DELETE', undefined, '"1"'],
    [`${root}staging-id/items`, 'POST', { fields: {} }],
    [`${root}other-list/items`], [`${root}staging-id/permissions`],
    [`${root}staging-id/items?$filter=Email%20ne%20null`],
    ['https://example.com/items'],
  ]) await assert.rejects(request(...args));
  assert.equal(calls.length, 2);
});

test('create unwraps fields and failures preserve status without leaking callback or response content', async () => {
  const request = createFlowTransport(config, async (_, options) => {
    const data = JSON.parse(options.body); assert.equal(data.operation, 'create'); assert.deepEqual(data.fields, { Email: 'alex@example.com' });
    return response(row, 201);
  });
  assert.equal((await request(`${root}added-id/items`, 'POST', { fields: { Email: 'alex@example.com' } })).eTag, '"3"');
  for (const status of [400, 404, 409, 412, 429, 500]) {
    const failing = createFlowTransport(config, async () => response({ error: config.flowUrl }, status));
    await assert.rejects(failing(`${root}staging-id/items/7`), error => error.status === status && !error.message.includes('private-key'));
  }
  const offline = createFlowTransport(config, async () => { throw new Error(config.flowUrl); });
  await assert.rejects(offline(`${root}staging-id/items`), error => !error.message.includes('private-key'));
});

test('pagination follows only the configured site and list, missing versions fail closed', async () => {
  const page = next => createFlowTransport(config, async () => response({ value: [row], 'odata.nextLink': next }));
  const next = "https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/_api/web/lists(guid'staging-id')/items?$skiptoken=Paged%3DTRUE%26p_ID%3D7";
  const result = await page(next)(`${root}staging-id/items?$expand=fields&$top=200`);
  assert.equal(new URL(result['@odata.nextLink']).searchParams.get('$skiptoken'), 'Paged=TRUE&p_ID=7');
  for (const url of [next.replace('randrltd.sharepoint.com', 'example.com'), next.replace('staging-id', 'other-id')]) await assert.rejects(page(url)(`${root}staging-id/items`), /pagination/);
  await assert.rejects(createFlowTransport(config, async () => response({ value: [{ Id: 1 }] }))(`${root}staging-id/items`), /record response/);
});

test('flow configuration needs no Graph secret and accepts only signed server callbacks', () => {
  const env = { CAPTURE_TENANT_ID: '9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f', CAPTURE_CLIENT_ID: '1da20b9d-2397-4a82-bfc8-9c3549f30cd3', CAPTURE_SITE_ID: 'site', CAPTURE_STAGING_LIST_ID: 'f3785741-154d-47ba-978c-74251305d71f', CAPTURE_ADDED_LIST_ID: '356eae0e-5456-418c-ad49-1cc04f072ff6', CAPTURE_STORAGE_MODE: 'flow', CAPTURE_FLOW_URL: config.flowUrl };
  assert.equal(readConfig(env).storageMode, 'flow');
  for (const url of ['https://example.com/?sig=x', 'http://demo.logic.azure.com/?sig=x', 'https://demo.logic.azure.com/', 'https://user:pass@demo.logic.azure.com/?sig=x']) assert.throws(() => readConfig({ ...env, CAPTURE_FLOW_URL: url }));
});
