# Hosting and updates

[Dynamine is hosted here](https://kind-ground-0ee249903.5.azurestaticapps.net/).

The existing Azure Static Web App hosts the page and its private API on the Free plan. No local Python server is needed for the shared demo. Existing Power Automate and AI Builder entitlements are separate from website hosting.

## Publish an update — app owner

From the repository, after signing in to Azure CLI:

```sh
npm ci --prefix api
npm test --prefix api
python3 setup/deploy-static-app.py
```

Commit and push changes to GitHub as well. **Pushing alone does not deploy this project.** The helper publishes the website and API together to the existing demo app.

After publishing, open the app, refresh records, and test a sample approval. Keep private connection values in Azure server settings only.

Resource details and local development instructions are in the [technical reference](technical-reference.md). Do not remove the shared resource group; it contains other applications.
