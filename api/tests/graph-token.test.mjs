import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraphTokenProvider } from '../lib/graph-token.mjs';
test('server credentials obtain and cache an app token, with refresh after expiry', async () => {
  let calls = 0, now = 1000;
  const provider = createGraphTokenProvider({ tenantId: 'tenant', clientId: 'app', clientSecret: 'test-only-secret' }, async (url, options) => {
    calls++; assert.equal(url, 'https://login.microsoftonline.com/tenant/oauth2/v2.0/token');
    assert.equal(options.body.get('grant_type'), 'client_credentials'); assert.equal(options.body.get('scope'), 'https://graph.microsoft.com/.default');
    assert.equal(options.body.get('client_secret'), 'test-only-secret'); assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify({ access_token: `application-token-${calls}`, expires_in: 3600 }), { status: 200 });
  }, () => now);
  assert.deepEqual(await Promise.all([provider(), provider()]), ['application-token-1', 'application-token-1']); assert.equal(calls, 1);
  now += 3600000; assert.equal(await provider(), 'application-token-2');
});
test('token errors are sanitised and can be retried', async () => {
  let calls = 0;
  const provider = createGraphTokenProvider({ tenantId: 'tenant' }, async () => { calls++; return new Response('sensitive error', { status: 401 }); });
  await assert.rejects(provider(), /backend could not authenticate/); await assert.rejects(provider(), /backend could not authenticate/); assert.equal(calls, 2);
});
