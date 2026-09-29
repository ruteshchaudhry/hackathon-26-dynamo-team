// Public configuration only. Never place secrets or mailbox passwords here.
export const config = Object.freeze({
  mode: 'live',
  environmentId: 'ae00c6cc-145f-41ea-bf30-1f0979a559c6',
  sharePointSiteUrl: 'https://randrltd.sharepoint.com/sites/PRJ_Nabo/',
  mailbox: 'testpmdyno-mine@outlook.com',
  // Hosted Entra sign-in enabled. SharePoint grants are tracked in setup/entra-access.md.
  tenantId: '9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f', clientId: '1da20b9d-2397-4a82-bfc8-9c3549f30cd3',
  siteId: 'randrltd.sharepoint.com,894b0995-6a6a-4cf4-bad4-8019c7e75632,04153bf3-0839-4c40-b6ef-486829aa6e4b',
  // Verified list IDs; field mappings are recorded in setup/sharepoint-schema.json.
  stagingListId: 'd2285f11-09dc-462b-b692-e3111a40c23f',
  addedListId: '85fc11a7-c916-4af3-b25e-1b7346aba98a',
});
