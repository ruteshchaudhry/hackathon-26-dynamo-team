import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiStore, reviewedFields } from '../frontend/api-store.mjs';
import { reviewedFields as serverFields } from '../api/lib/sharepoint-store.mjs';
test('browser calls only fixed same-origin API operations with an app token', async () => {
  const calls = [], expected = { id: '1', eTag: '"1"', fields: { ApprovedBy: 'forged' } };
  const store = createApiStore({ getToken: async () => 'api-token', fetcher: async (url, options) => {
    calls.push({ url, options }); return new Response(JSON.stringify({ ok: true }));
  } });
  await store.read(); await store.save(expected, { Email: 'alex@example.com' }); await store.approve(expected);
  assert.deepEqual(calls.map(c => c.url), ['/api/contacts', '/api/contacts/save', '/api/contacts/approve']);
  for (const { options } of calls) { assert.equal(options.headers['X-Capture-Authorization'], 'Bearer api-token'); assert.equal(options.redirect, 'error'); }
  assert.deepEqual(JSON.parse(calls[2].options.body), { expected: { id: '1', eTag: '"1"' } });
});
test('frontend and server agree on reviewed contact normalization', () => {
  const fields = { Email: ' Alex@Example.com ', FirstName: ' Alex ', TargetLabel: ' Court ' };
  assert.deepEqual(reviewedFields(fields), serverFields(fields));
});
