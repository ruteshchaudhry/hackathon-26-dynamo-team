// Public configuration only. Never place secrets or mailbox passwords here.
export const config = Object.freeze({
  mode: 'demo',
  environmentId: 'ae00c6cc-145f-41ea-bf30-1f0979a559c6',
  sharePointSiteUrl: 'https://randrltd.sharepoint.com/sites/PRJ_Nabo/',
  mailbox: 'testpmdyno-mine@outlook.com',
  // Supply after tenant setup; live authentication is not implemented yet.
  tenantId: '', clientId: '', siteId: '',
  // Verified list IDs; field mappings are recorded in setup/sharepoint-schema.json.
  stagingListId: 'd2285f11-09dc-462b-b692-e3111a40c23f',
  addedListId: '85fc11a7-c916-4af3-b25e-1b7346aba98a',
});
