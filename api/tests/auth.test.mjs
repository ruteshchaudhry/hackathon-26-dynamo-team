import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { createAuthenticator } from '../lib/auth.mjs';

const config = { tenantId: '9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f', clientId: '1da20b9d-2397-4a82-bfc8-9c3549f30cd3' };
const { publicKey, privateKey } = await generateKeyPair('RS256');
const authenticate = createAuthenticator(config, publicKey);
const oid = '428a36fc-bbd1-48f1-ba6f-49e59f4414ee';
async function bearer(overrides = {}, key = privateKey) {
  return `Bearer ${await new SignJWT({
    iss: `https://login.microsoftonline.com/${config.tenantId}/v2.0`, aud: config.clientId,
    tid: config.tenantId, azp: config.clientId, scp: 'access_as_user', ver: '2.0', oid,
    sub: 'test-user', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 600,
    ...overrides,
  }).setProtectedHeader({ alg: 'RS256' }).sign(key)}`;
}
test('tenant users are accepted without SharePoint scopes, roles or groups', async () => {
  assert.deepEqual(await authenticate(await bearer()), { reviewerId: oid });
  const other = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  assert.deepEqual(await authenticate(await bearer({ oid: other })), { reviewerId: other });
});
test('rejects absent, expired, wrong-tenant, wrong-audience and non-API tokens', async () => {
  await assert.rejects(authenticate(''), /Sign in/);
  for (const overrides of [
    { exp: 1 }, { exp: undefined }, { aud: 'https://graph.microsoft.com' }, { tid: 'other-tenant' },
    { iss: 'https://evil.example' }, { azp: 'other-client' }, { scp: undefined },
    { scp: 'User.Read' }, { ver: '1.0' }, { oid: undefined },
  ]) await assert.rejects(authenticate(await bearer(overrides)), /invalid or expired/);
});
test('rejects forged signatures', async () => {
  const attacker = await generateKeyPair('RS256');
  await assert.rejects(authenticate(await bearer({}, attacker.privateKey)), /invalid or expired/);
});
