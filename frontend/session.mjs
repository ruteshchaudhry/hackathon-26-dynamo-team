const attempted = 'capture.signInAttempted';
const signedOut = 'capture.signedOut';

export async function beginSignIn(auth, scopes, storage) {
  storage.removeItem(signedOut);
  storage.setItem(attempted, 'true');
  // Omitting prompt lets Microsoft reuse an existing browser work-account session.
  await auth.loginRedirect({ scopes });
}

export async function resumeSignIn(auth, scopes, storage) {
  if (storage.getItem(signedOut)) return null;
  try {
    const result = await auth.ssoSilent({ scopes });
    if (result.account) return result.account;
  } catch { /* Browser cookie restrictions or consent may require a top-level redirect. */ }
  // Try one automatic redirect per tab; errors return to a usable sign-in button.
  if (!storage.getItem(attempted)) await beginSignIn(auth, scopes, storage);
  return null;
}

export function markSignedOut(storage) {
  storage.setItem(signedOut, 'true');
  storage.removeItem(attempted);
}
