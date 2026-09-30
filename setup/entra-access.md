# Customer Capture: app sign-in and backend access

## Agreed access model — 30 September 2026

Every user who can sign in to the single-tenant Customer Capture app can view, edit and approve the shared demo queue. **End users do not need SharePoint site or list permissions.** There are no reviewer roles, invitations or per-user SharePoint checks.

The browser obtains an access token for our API. The API validates its signature, issuer, tenant, audience, expiry, caller and `access_as_user` scope. It then uses a server-held application credential to obtain a separate Graph application token. The browser never receives that credential or Graph token. ApprovedBy comes from the verified user's object ID, not the request body.

The UI uses contact-review language, without naming storage or implementation technologies. Sign-in first reuses a cached account or attempts silent Microsoft SSO. If required, it redirects once to Microsoft without forcing account selection. Consent, MFA or multiple browser accounts can still require interaction. Explicit sign-out suppresses automatic sign-in in that tab.

## Current state

The API and frontend changes are implemented in source and tested using signed test tokens and simulated Graph responses. **Deployment of this new version is in progress.** The hosted deployment result and verification will be recorded below. Earlier Microsoft sign-in succeeded, but its delegated list reads were denied.

The existing site can stay if an authorised owner/admin grants the application access. Alternatively, the user will provide a new owned site. No lists or records have been moved. API access_as_user scope, v2 tokens and SPA preauthorisation are applied. The selected-list Graph application permission is requested in the registration, but its admin-consent request returned HTTP 403. Backend identifiers and a seven-day credential are stored in Azure server settings. The credential expires **7 October 2026 at 03:11 UTC**; its value was never printed or saved to disk. Application consent and the two list grants remain pending.

| Setting | Value |
|---|---|
| Tenant | `9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f` |
| Customer Capture application/client ID | `1da20b9d-2397-4a82-bfc8-9c3549f30cd3` |
| Application object ID | `6c824978-4ae9-4565-935e-1a6e8aa2132e` |
| Enterprise application object ID | `1787a630-f3e0-46d0-9dec-b76cfcb27a61` |
| Hosted SPA redirect | `https://kind-ground-0ee249903.5.azurestaticapps.net/` |
| API scope to expose | `api://1da20b9d-2397-4a82-bfc8-9c3549f30cd3/access_as_user` |
| Graph permission to configure | **Application** `Lists.SelectedOperations.Selected` |
| Graph application-role ID | `23c5a9bd-d900-4ecf-be26-a0689755d9e5` |
| ContactStaging | `d2285f11-09dc-462b-b692-e3111a40c23f` |
| AddedContacts | `85fc11a7-c916-4af3-b25e-1b7346aba98a` |

The repeatable setup helper is `python3 setup/configure-backend.py --apply`. It preserves existing settings/credentials and applies no SharePoint list grants. Run it only when configuring this demo; an admin can complete the pending consent in Entra.

## 1. Configure API sign-in (applied)

Reuse the existing single-tenant registration for this small demo's SPA and protected API; the credential is used only by the server. Keep its existing SPA hosted redirect and `appRoleAssignmentRequired=false`. Do not add a localhost redirect.

In **Expose an API**, set the application ID URI to `api://1da20b9d-2397-4a82-bfc8-9c3549f30cd3` and create the enabled delegated scope `access_as_user` with admin consent (display name: Access Customer Capture; description: Review and approve demo contact suggestions). Set `api.requestedAccessTokenVersion` to `2` in the application manifest. Authorise the existing SPA client ID for that scope, or configure the equivalent delegated permission and tenant-wide consent. All tenant users have the same app access; the API does not require a user group/role assignment or SharePoint access.

This is a scope for **our API**, not a user-delegated SharePoint permission. The frontend requests only this API scope; the earlier delegated Graph permission is no longer needed by the new source. Retire it after the new deployment is verified; do not revoke unrelated setup-client consents.

## 2. Configure backend application access

Add Microsoft Graph → **Application permissions** → `Lists.SelectedOperations.Selected`, then obtain tenant admin consent. Delegated consent from the earlier build does not satisfy this requirement.

Create an expiring application credential for this registration and place its value directly in the Static Web App's server application setting `CAPTURE_CLIENT_SECRET`. Do not paste it into chat, frontend files, a committed JSON file, command-line arguments or logs. This demo uses a secret because managed Static Web Apps Functions do not support managed identity. Record its expiry for the app owner and remove the demo credential when finished.

Configure the remaining settings from [backend-settings.example.json](backend-settings.example.json) in the same server settings. That file intentionally contains only public identifiers; the credential must be added separately. The code reads all site/list IDs from these settings, so a future site move does not require changing frontend code.

## 3. Grant the application access to only the two lists

An authorised site owner/admin must use a Graph setup client with sufficient permission-management rights. Microsoft's Selected permissions guidance lists `Sites.FullControl.All` or suitable selected owner/full-control access for list grants; this is the **setup client's** permission, not Customer Capture's runtime permission. Ownership alone does not grant Entra admin consent.

For each list, first GET its permissions collection and check for an existing Customer Capture write grant; preserve existing users/groups. POST the body in [sharepoint-app-grant.json](sharepoint-app-grant.json) to:

```text
https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,894b0995-6a6a-4cf4-bad4-8019c7e75632,04153bf3-0839-4c40-b6ef-486829aa6e4b/lists/d2285f11-09dc-462b-b692-e3111a40c23f/permissions
https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,894b0995-6a6a-4cf4-bad4-8019c7e75632,04153bf3-0839-4c40-b6ef-486829aa6e4b/lists/85fc11a7-c916-4af3-b25e-1b7346aba98a/permissions
```

A prepared [batch](sharepoint-app-grants-batch.json) is also available. Confirm each inner response succeeds and GET the permissions again. An outer batch 200 is not proof of successful grants. Selected-list grants break inheritance; retain existing groups/users. No broad site-wide runtime grant is needed.

The original site's advanced permissions page denied the current account permission-management access. On 29 September the two grant requests returned 403; the last batch request ID was `0d228fb0-4c80-4d7b-9160-f75b5753029e`. No application list grant has been confirmed. The account could access content but not manage site permissions. No access request was sent and no existing permission entry was removed.

If using a new site, create both lists with the verified schema, preserve unique keys, update the backend settings and both SharePoint reads plus the create action in the scan flow. Update prepared grant request URLs to the new IDs. Leave original records untouched until migration is verified.

## 4. Deploy and verify

Follow [deployment notes](azure-static-web-app.md) to publish frontend and API together after configuration. Verify:

- A tenant user with **no direct SharePoint access** can sign in, see pending contacts, save corrections and approve.
- Corrected values persist in AddedContacts before staging deletion; count survives refresh and is shared across users.
- Unauthenticated, expired, wrong-tenant and wrong-audience tokens cannot read or mutate data.
- Retry after a failed save/cleanup does not create a duplicate.
- Existing Microsoft browser sign-in is reused where possible; sign-out does not immediately sign the user back in.

Power Automate keeps its own connection and permissions. Dynamics stays read-only. Live approval and browser SSO behavior on this new API architecture remain unverified until setup/deployment.

References: [Selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview), [API claim validation](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation), [Static Web Apps managed API capabilities](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions).
