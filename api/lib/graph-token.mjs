// Only the backend exchanges its own credential for a Graph application token.
export function createGraphTokenProvider(config, fetcher = fetch, now = Date.now) {
  let token, expiresAt = 0, pending;
  return async function getToken() {
    if (token && now() < expiresAt) return token;
    if (!pending) pending = (async () => {
      const response = await fetcher(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'client_credentials', scope: 'https://graph.microsoft.com/.default' }),
      });
      if (!response.ok) throw new Error('The backend could not authenticate to SharePoint. Ask the app owner to check the application credential and consent.');
      const result = await response.json();
      if (typeof result.access_token !== 'string' || !Number.isFinite(Number(result.expires_in))) throw new Error('The backend received an invalid application token response.');
      token = result.access_token; expiresAt = now() + Math.max(0, Number(result.expires_in) - 60) * 1000;
      return token;
    })().finally(() => { pending = undefined; });
    return pending;
  };
}
