import { app } from '@azure/functions';
import { readConfig } from '../lib/config.mjs';
import { createAuthenticator } from '../lib/auth.mjs';
import { createGraphTokenProvider } from '../lib/graph-token.mjs';
import { createHandler } from '../lib/handler.mjs';

let handler;
app.http('contacts', {
  route: 'contacts/{action?}', methods: ['GET', 'POST'],
  // Entra bearer validation is performed by our handler on EVERY operation.
  // Function keys and the built-in multi-tenant SWA login are not used.
  authLevel: 'anonymous',
  handler: async request => {
    if (!handler) {
      try {
        const config = readConfig();
        handler = createHandler({ config, authenticate: createAuthenticator(config), getToken: config.storageMode === 'graph' ? createGraphTokenProvider(config) : undefined });
      } catch {
        return { status: 503, headers: { 'Cache-Control': 'no-store' }, jsonBody: { error: 'Contact records are not ready yet. Please contact the app owner.' } };
      }
    }
    return handler(request);
  },
});
