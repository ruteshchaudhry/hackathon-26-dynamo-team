# Customer Capture: proposed Entra and SharePoint access

**Status:** code prepared, organisational changes blocked pending explicit approval. No app registration, app consent, list app grant or pilot assignment has been created in this task. Automatic approval review rejected the initial registration request because those access changes and redirect scopes had not been explicitly approved.

## Exact proposed configuration

| Setting | Value |
|---|---|
| Registration name | Customer Capture |
| Tenant | 9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f |
| Account audience | This organisation only (AzureADMyOrg) |
| Platform | Single-page application; no client secret |
| Hosted redirect | https://kind-ground-0ee249903.5.azurestaticapps.net/ |
| Local redirect | http://localhost:8000/ |
| Delegated Graph permission | Lists.SelectedOperations.Selected |
| Permission scope ID | 033b51ee-d6fa-4add-b627-ee680c7212b5 |
| Resource grants | write on ContactStaging and AddedContacts only |
| SharePoint site | https://randrltd.sharepoint.com/sites/PRJ_Nabo/ |
| Initial assigned pilot | Rutesh Chaudhary, object ID 428a36fc-bbd1-48f1-ba6f-49e59f4414ee |
| Enterprise app | Assignment required; only that pilot initially |

The grant allows the app, acting as the signed-in authorised reviewer, to read, create, edit and delete records in those two lists. No application-only permissions, mailbox permission or Dynamics permission is requested by the SPA. The reviewer’s existing list access is also required. Other pilot users must be explicitly assigned later.

A selected-list grant breaks permission inheritance on the selected lists. Existing access should be inspected and preserved; do not change broader site access or silently broaden to Sites.ReadWrite.All if selected access fails. Obtain the owner’s decision if the tenant does not support the proposed setup.

## Setup after approval

1. Create the registration with the two exact SPA redirect URIs and delegated scope above.
2. Create/configure its enterprise application with assignment required and assign the named pilot.
3. Obtain authorised administrator consent for the delegated scope.
4. Grant the application the `write` role on the two existing lists through Graph list permissions. IDs and schema are in [sharepoint-schema.json](sharepoint-schema.json). Do not grant access to the whole site.
5. Set the public application/client ID in `frontend/config.js` and change `mode` to `live`. Tenant/site/list IDs are already configured.
6. Test localhost sign-in and actual list reads/writes with the staged synthetic contact. No mailbox or customer passwords belong in configuration.
7. Deploy the verified frontend and test the hosted redirect, shared count and denied-user behavior.

The app uses redirect authentication and handleRedirectPromise at the root URL. MSAL 5.23.0 is vendored with its license; records stay in memory and tokens use sessionStorage. On silent renewal failure, sign out/in rather than retrying a possibly completed write automatically.

## Later Dynamics handoff

AddedContacts is the durable approved source. Preserve it after staging cleanup. A future import/flow can consume it, recheck exact email and resolve mandatory Dynamics fields and target/role IDs before writing. Add import status, resulting Dynamics IDs and retry history when that integration is built; none is implemented now.

References: [delegated selected permissions and inheritance](https://learn.microsoft.com/en-us/graph/permissions-selected-overview), [list permission grant API](https://learn.microsoft.com/en-us/graph/api/list-post-permissions?view=graph-rest-1.0).
