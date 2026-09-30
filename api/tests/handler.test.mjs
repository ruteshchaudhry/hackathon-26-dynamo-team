import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.mjs';
const req = (action = '', body, headers = {}) => ({
  params: { action }, method: body ? 'POST' : 'GET',
  headers: new Headers({ 'x-capture-authorization': 'Bearer api-token', 'content-type': 'application/json', ...headers }),
  text: async () => typeof body === 'string' ? body : JSON.stringify(body),
});
const expected = { id: '1', eTag: '"version-1"' };
test('requires app authentication for reads and writes before any storage operation', async () => {
  let calls = 0;
  const handler = createHandler({ authenticate: async () => { throw new Error('Sign in'); }, storeFactory: () => { calls++; } });
  for (const request of [req(), req('approve', { expected })]) {
    const result = await handler(request); assert.equal(result.status, 401); assert.equal(result.headers['Cache-Control'], 'no-store');
  }
  assert.equal(calls, 0);
});
test('server chooses list configuration and reviewer, strips client-controlled metadata', async () => {
  let options, saved, approved;
  const config = { siteId: 'server-only-site' }, getToken = async () => 'server-graph-token';
  const handler = createHandler({ config, getToken, authenticate: async () => ({ reviewerId: 'verified-user' }),
    storeFactory: value => { options = value; return { save: async (...args) => { saved = args; return {}; }, approve: async value => { approved = value; return {}; }, read: async () => ({ pending: [], added: [] }) }; },
  });
  const fields = { Email: 'Alex@example.com', FirstName: 'Alex', ApprovedBy: 'forged-user', Status: 'CleanupPending', SourceStagingId: '999', TargetId: 'forged' };
  assert.equal((await handler(req('save', { expected, fields, siteId: 'attacker-site', reviewerId: 'forged-user' }))).status, 200);
  assert.equal(options.config, config); assert.equal(options.getToken, getToken); assert.equal(options.reviewerId, 'verified-user');
  assert.deepEqual(saved[0], expected); assert.equal(saved[1].CandidateKey, 'alex@example.com'); assert.equal(saved[1].ApprovedBy, undefined); assert.equal(saved[1].TargetId, undefined);
  assert.equal((await handler(req('approve', { expected: { ...expected, fields }, reviewerId: 'forged-user' }))).status, 200);
  assert.deepEqual(approved, expected);
  assert.equal((await handler(req())).status, 200);
});
test('malformed input, arbitrary routes and wildcard versions never reach storage', async () => {
  let calls = 0;
  const handler = createHandler({ authenticate: async () => ({ reviewerId: 'user' }), storeFactory: () => { calls++; } });
  for (const body of ['broken json', { expected: { id: '../permissions', eTag: '"1"' } }, { expected: { id: '1', eTag: '*' } }, { expected: { id: '1' } }, 'x'.repeat(8193)]) {
    assert.equal((await handler(req('approve', body))).status, 400);
  }
  assert.equal((await handler(req('save', { expected, fields: { Email: 'bad email' } }))).status, 400);
  assert.equal((await handler(req('permissions', { expected }))).status, 404); assert.equal(calls, 0);
});
test('backend list denial never asks end users for SharePoint permission or exposes secrets', async () => {
  const handler = createHandler({ authenticate: async () => ({ reviewerId: 'user' }),
    storeFactory: () => ({ read: async () => { throw new Error('network error secret=do-not-leak'); } }),
  });
  const result = await handler(req()); assert.equal(result.status, 502); assert.ok(!JSON.stringify(result).includes('do-not-leak'));
});
test('uses the app token header and never the hosting gateway Authorization token', async () => {
  let supplied;
  const handler = createHandler({ authenticate: async token => { supplied = token; throw new Error('Sign in'); } });
  await handler(req('', undefined, { authorization: 'Bearer platform-token' }));
  assert.equal(supplied, 'Bearer api-token');
  await handler(req('', undefined, { authorization: 'Bearer platform-token', 'x-capture-authorization': '' }));
  assert.equal(supplied, '');
});
