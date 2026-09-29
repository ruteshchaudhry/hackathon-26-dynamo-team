# Azure Static Web App

Site: [Customer Capture](https://kind-ground-0ee249903.5.azurestaticapps.net/).

Deployment target: `swa-customer-capture-dev-20e0` in the existing `rg-portalapp-dev-uks` resource group, subscription `36a7b914-f275-4782-a9ea-bda7362ff589`, West Europe. The SKU is **Free**. The group also contains other applications; this template manages only Customer Capture.

Verified on 29 September 2026: all app assets return HTTP 200 with expected MIME types. The hosted review dialog, sample approval, Added contacts navigation and reload persistence passed browser checks.

## What is deployed

Only `frontend/` is published. It contains static HTML, CSS, JavaScript and synthetic fixtures. The app retains the deep blue/light blue/magenta palette without organisation names or logos. No Python server is needed in Azure. Hash navigation works without server-side route rewrites, and `staticwebapp.config.json` explicitly serves `.mjs` as JavaScript.

The current site is an anonymous sample-data demo. Records are stored separately per browser and origin. It does not yet read live SharePoint records, sign in through Entra, or invoke Power Automate. Hosting does not change those integration limits. Never enter real customer information into this sample-data version.

## Redeploy frontend changes

Sign in with `az login` if necessary, then run from the repository root:

```sh
python3 setup/deploy-static-app.py
```

The helper reads the app deployment credential through Azure CLI, passes it only in the child process environment and redacts it from output. It does not save the credential or use the operating-system keychain. It publishes to the production slot of this demo resource. Node.js/npm and Azure CLI are required; the Microsoft SWA CLI is pinned to version 2.0.10. There is no GitHub automatic-deployment workflow configured yet.

## Reconcile infrastructure

The Bicep template contains one Free Static Web App. Use **Incremental** mode with the existing resource group:

```sh
az deployment group create --subscription 36a7b914-f275-4782-a9ea-bda7362ff589 --resource-group rg-portalapp-dev-uks --name customer-capture-20e0 --template-file infra/main.bicep --parameters @infra/main.parameters.json --mode Incremental
```

## Next: activate shared data and organisational sign-in

The Entra/Graph adapter is prepared locally and tested with simulated API responses. The deployed site remains in sample-data mode until the [specific access setup](entra-access.md) is approved and configured. Then set the client ID and live mode, redeploy and verify real reads, corrections, direct AddedContacts creation, staging cleanup and count. No approval flow is needed. The ingestion flow remains designer-run; use Refresh records in the app.

## Remove only this demo when finished

Do not delete the shared resource group. To remove this app alone:

```sh
az staticwebapp delete --subscription 36a7b914-f275-4782-a9ea-bda7362ff589 --resource-group rg-portalapp-dev-uks --name swa-customer-capture-dev-20e0
```

References: [SWA CLI deployment](https://learn.microsoft.com/en-us/azure/static-web-apps/static-web-apps-cli-deploy), [site configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration), [Free plan pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/).
