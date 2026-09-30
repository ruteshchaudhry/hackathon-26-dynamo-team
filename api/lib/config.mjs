export function readConfig(env = process.env) {
  const names = ['CAPTURE_TENANT_ID', 'CAPTURE_CLIENT_ID', 'CAPTURE_CLIENT_SECRET', 'CAPTURE_SITE_ID', 'CAPTURE_STAGING_LIST_ID', 'CAPTURE_ADDED_LIST_ID'];
  if (names.some(name => !env[name]?.trim())) throw new Error('Backend setup is incomplete. Ask the app owner to configure the Entra app credential and SharePoint lists.');
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![env.CAPTURE_TENANT_ID, env.CAPTURE_CLIENT_ID, env.CAPTURE_STAGING_LIST_ID, env.CAPTURE_ADDED_LIST_ID].every(value => guid.test(value))) throw new Error('Backend identifiers are invalid.');
  if (env.CAPTURE_STAGING_LIST_ID === env.CAPTURE_ADDED_LIST_ID) throw new Error('Staging and approved lists must be different.');
  return {
    tenantId: env.CAPTURE_TENANT_ID, clientId: env.CAPTURE_CLIENT_ID, clientSecret: env.CAPTURE_CLIENT_SECRET,
    siteId: env.CAPTURE_SITE_ID, stagingListId: env.CAPTURE_STAGING_LIST_ID, addedListId: env.CAPTURE_ADDED_LIST_ID,
  };
}
