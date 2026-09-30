# Azure Static Web App

Site: [Customer Capture](https://kind-ground-0ee249903.5.azurestaticapps.net/).

Deployment target: `swa-customer-capture-dev-20e0` in the existing `rg-portalapp-dev-uks` resource group, subscription `36a7b914-f275-4782-a9ea-bda7362ff589`, West Europe. The SKU is **Free**. The group also contains other applications; this template manages only Customer Capture.

Verified on 29 September 2026: all app assets return HTTP 200 with expected MIME types. The hosted review dialog, sample approval, Added contacts navigation and reload persistence passed browser checks.

## Source and deployed status

The source contains static HTML/CSS/JavaScript in `frontend/` and a JavaScript managed Azure Functions API in `api/`. Both are now deployed to the existing Free Static Web App. API scope and server settings are configured. Entra admin consent for the Graph application permission returned 403 and remains pending, along with both list grants. See [access setup](entra-access.md).

Managed HTTP APIs are included in the Free plan. No separate Function App, Python server or hosting-tier upgrade is required. The API runtime is Node 22, configured in staticwebapp.config.json. The backend validates our own Entra API access tokens; it does not depend on Static Web Apps custom authentication registrations or user SharePoint permissions. Secrets live only in server application settings. Managed Functions do not offer managed identity.

## Deploy frontend and API together

Complete [access setup](entra-access.md), including server application settings. Then run from the repository root:

```sh
npm ci --prefix api
npm test --prefix api
python3 setup/deploy-static-app.py
```

The helper installs the pinned API dependencies from the lockfile, retrieves the deployment credential through Azure CLI and passes it only in the child process environment, redacting it from output. It publishes both frontend and API to this demo's production slot. Node.js/npm and Azure CLI sign-in are required. The SWA CLI is pinned to 2.0.10; there is no automatic GitHub deployment. Only frontend assets become publicly served files; api/ runs as Functions and server settings remain private.

Check `/api/contacts` without a token returns 401 after backend configuration, then test a signed-in tenant user with no direct SharePoint access. Verify corrected approval, read-back, pending removal and count after reload. A 503 indicates backend settings are not ready; raw setup errors are not shown to app users. The deployed unauthenticated read and approval endpoints returned 401; session.mjs returned 200 with the SSO code. Live data/approval verification remains pending consent and list grants.

References: [hosting plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans), [managed APIs](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions), [CLI deployment](https://azure.github.io/static-web-apps-cli/docs/cli/swa-deploy/).

## Reconcile infrastructure

The Bicep template contains one Free Static Web App. Use **Incremental** mode with the existing resource group:

```sh
az deployment group create --subscription 36a7b914-f275-4782-a9ea-bda7362ff589 --resource-group rg-portalapp-dev-uks --name customer-capture-20e0 --template-file infra/main.bicep --parameters @infra/main.parameters.json --mode Incremental
```

## Remove only this demo when finished

Do not delete the shared resource group. To remove this app alone:

```sh
az staticwebapp delete --subscription 36a7b914-f275-4782-a9ea-bda7362ff589 --resource-group rg-portalapp-dev-uks --name swa-customer-capture-dev-20e0
```

References: [SWA CLI deployment](https://learn.microsoft.com/en-us/azure/static-web-apps/static-web-apps-cli-deploy), [site configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration), [Free plan pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/).
