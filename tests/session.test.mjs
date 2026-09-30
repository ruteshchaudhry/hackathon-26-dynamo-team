import test from 'node:test';
import assert from 'node:assert/strict';
import { resumeSignIn, beginSignIn, markSignedOut } from '../frontend/session.mjs';
const storage = () => { const map = new Map(); return { getItem: key => map.get(key), setItem: (key, value) => map.set(key,value), removeItem: key => map.delete(key) }; };
test('existing Microsoft session opens the app silently', async () => {
  const account = { tenantId: 'tenant' };
  assert.equal(await resumeSignIn({ ssoSilent: async () => ({ account }), loginRedirect: () => assert.fail('No redirect needed') }, ['app-scope'], storage()), account);
});
test('silent failure redirects once without forcing account selection and cannot loop', async () => {
  let redirects = 0; const cache = storage();
  const auth = { ssoSilent: async () => { throw new Error('Interaction needed'); }, loginRedirect: async options => { redirects++; assert.deepEqual(options, { scopes: ['app-scope'] }); } };
  await resumeSignIn(auth, ['app-scope'], cache); await resumeSignIn(auth, ['app-scope'], cache); assert.equal(redirects, 1);
  markSignedOut(cache); await resumeSignIn(auth, ['app-scope'], cache); assert.equal(redirects, 1);
  await beginSignIn(auth, ['app-scope'], cache); assert.equal(redirects, 2);
});
