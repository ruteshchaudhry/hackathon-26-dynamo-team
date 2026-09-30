import { createRemoteJWKSet, jwtVerify } from 'jose';

export function createAuthenticator(config, keySet) {
  const issuer = `https://login.microsoftonline.com/${config.tenantId}/v2.0`;
  const keys = keySet || createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`));
  return async authorization => {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization || '');
    if (!match) throw new Error('Sign in with your organisational Microsoft account.');
    try {
      const { payload } = await jwtVerify(match[1], keys, {
        issuer, audience: config.clientId, algorithms: ['RS256'],
        requiredClaims: ['exp', 'iat', 'sub', 'oid', 'tid', 'scp', 'azp', 'ver'], clockTolerance: 5,
      });
      // All signed-in tenant users have the same demo access. No SharePoint user checks.
      // A delegated API access token is required; ID tokens and app-only callers are rejected.
      if (payload.ver !== '2.0' || payload.tid !== config.tenantId || payload.azp !== config.clientId ||
          typeof payload.scp !== 'string' || !payload.scp.split(' ').includes('access_as_user') ||
          typeof payload.oid !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.oid)) throw new Error('Invalid claims');
      return { reviewerId: payload.oid };
    } catch {
      throw new Error('Your app sign-in is invalid or expired. Sign out and sign in again.');
    }
  };
}
