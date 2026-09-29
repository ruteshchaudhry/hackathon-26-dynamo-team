// Deploy incrementally into the existing rg-portalapp-dev-uks resource group.
// The shared resource group and its existing applications are not managed here.
targetScope = 'resourceGroup'

@allowed(['swa-customer-capture-dev-20e0'])
param staticWebAppName string

@allowed(['westeurope'])
param location string

param environmentName string
param sessionId string
param deployedBy string
param createdAt string

var tags = {
  'app-onboard-skill': 'true'
  'app-onboard-session-id': sessionId
  'created-at': createdAt
  environment: environmentName
  'deployed-by': deployedBy
}

// Detached deployment: application files are uploaded separately with SWA CLI.
resource staticWebApp 'Microsoft.Web/staticSites@2025-05-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output staticWebAppId string = staticWebApp.id
output resourceName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
output siteUrl string = 'https://${staticWebApp.properties.defaultHostname}'
