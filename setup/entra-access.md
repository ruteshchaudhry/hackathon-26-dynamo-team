# Customer Capture: app sign-in and backend access

## Agreed access model — 30 September 2026

Every user who can sign in to the single-tenant Customer Capture app can view, edit and approve the shared demo queue. **End users do not need SharePoint site or list permissions.** There are no reviewer roles, invitations or per-user SharePoint checks.

The browser obtains an access token for our API and sends it as `X-Capture-Authorization: Bearer <token>` because Static Web Apps rewrites the standard Authorization header on the managed-Functions hop. The API validates its signature, issuer, tenant, audience, expiry, caller and `access_as_user` scope. It then uses a server-held application credential to obtain a separate Graph application token. The browser never receives that credential or Graph token. ApprovedBy comes from the verified user's object ID, not the request body.

The UI uses contact-review language, without naming storage or implementation technologies. Sign-in first reuses a cached account or attempts silent Microsoft SSO. If required, it redirects once to Microsoft without forcing account selection. Consent, MFA or multiple browser accounts can still require interaction. Explicit sign-out suppresses automatic sign-in in that tab.

## Current state

The API and frontend changes are implemented in source and tested using signed test tokens and simulated Graph responses. **Frontend and managed API were deployed on 30 September 2026.** The live API returns 401 for unauthenticated reads and approvals. The new UI wording and sign-in module are live. End-to-end shared-data approval remains blocked by application admin consent. The hosted sign-in test reached Microsoft Authenticator MFA; the user was away, so completion and silent session reuse in this browser are not yet verified.

The lists were copied to [Customer Capture Demo](https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/) on 30 September 2026. Their internal field names, defaults and unique keys are preserved. The deployed Azure backend settings now use the new site/list IDs below, verified by reading the settings back. The existing credential was retained. Both scan lookups and the staging-create action have been retargeted; the sample scan created one Pending Alex Morgan record on the new site. Original lists and records remain untouched.

API access_as_user scope, v2 tokens and SPA preauthorisation are applied. The selected-list Graph application permission is requested in the registration, but administrator consent is still absent (checked 30 September). The earlier attempt to grant it returned HTTP 403. An Entra administrator must grant **Microsoft Graph → Application → Lists.SelectedOperations.Selected** for Customer Capture. Site ownership does not supply this consent. The server credential expires **7 October 2026 at 03:11 UTC**; its value was never printed or saved to disk. Both new-site application list grants were created successfully (HTTP 201) and read back on 30 September. Both lists retain Owners, Visitors, Members and Rutesh permissions. A direct backend client-credentials read still returns HTTP 401 on each list because application admin consent is missing.

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
| ContactStaging | `f3785741-154d-47ba-978c-74251305d71f` |
| AddedContacts | `356eae0e-5456-418c-ad49-1cc04f072ff6` |

The repeatable setup helper is `python3 setup/configure-backend.py --apply`. It preserves existing settings/credentials and applies no SharePoint list grants. Run it only when configuring this demo; an admin can complete the pending consent in Entra.

## 1. Configure API sign-in (applied)

Reuse the existing single-tenant registration for this small demo's SPA and protected API; the credential is used only by the server. Keep its existing SPA hosted redirect and `appRoleAssignmentRequired=false`. Do not add a localhost redirect.

In **Expose an API**, set the application ID URI to `api://1da20b9d-2397-4a82-bfc8-9c3549f30cd3` and create the enabled delegated scope `access_as_user` with admin consent (display name: Access Customer Capture; description: Review and approve demo contact suggestions). Set `api.requestedAccessTokenVersion` to `2` in the application manifest. Authorise the existing SPA client ID for that scope, or configure the equivalent delegated permission and tenant-wide consent. All tenant users have the same app access; the API does not require a user group/role assignment or SharePoint access.

This is a scope for **our API**, not a user-delegated SharePoint permission. The frontend requests only this API scope; the earlier delegated Graph permission is no longer needed by the new source. Retire it after the new deployment is verified; do not revoke unrelated setup-client consents.

## Administrator action still needed

In Microsoft Entra admin center, open **App registrations → Customer Capture** (client ID `1da20b9d-2397-4a82-bfc8-9c3549f30cd3`) → **API permissions**. Confirm the Microsoft Graph permission `Lists.SelectedOperations.Selected` has **Type: Application**, then choose **Grant admin consent** using an authorised Entra administrator account. The existing delegated permission is a different grant and cannot authorise the app-only backend. Do not add broad Sites.ReadWrite.All to Customer Capture.

After consent, repeat the app-only list read and hosted approval tests. The new site is already configured and both list grants are verified, so those steps need not be repeated.

## 2. Configure backend application access

Add Microsoft Graph → **Application permissions** → `Lists.SelectedOperations.Selected`, then obtain tenant admin consent. Delegated consent from the earlier build does not satisfy this requirement.

Create an expiring application credential for this registration and place its value directly in the Static Web App's server application setting `CAPTURE_CLIENT_SECRET`. Do not paste it into chat, frontend files, a committed JSON file, command-line arguments or logs. This demo uses a secret because managed Static Web Apps Functions do not support managed identity. Record its expiry for the app owner and remove the demo credential when finished.

Configure the remaining settings from [backend-settings.example.json](backend-settings.example.json) in the same server settings. That file intentionally contains only public identifiers; the credential must be added separately. The code reads all site/list IDs from these settings, so a future site move does not require changing frontend code.

## 3. Grant the application access to only the two lists (completed)

An authorised site owner/admin must use a Graph setup client with sufficient permission-management rights. Microsoft's Selected permissions guidance lists `Sites.FullControl.All` or suitable selected owner/full-control access for list grants; this is the **setup client's** permission, not Customer Capture's runtime permission. Ownership alone does not grant Entra admin consent.

For each list, first GET its permissions collection and check for an existing Customer Capture write grant; preserve existing users/groups. POST the body in [sharepoint-app-grant.json](sharepoint-app-grant.json) to:

```text
https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,8c9ebb5e-d984-4579-8836-08759bf23496,cbbbc411-10d3-440d-968a-a157504fca73/lists/f3785741-154d-47ba-978c-74251305d71f/permissions
https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,8c9ebb5e-d984-4579-8836-08759bf23496,cbbbc411-10d3-440d-968a-a157504fca73/lists/356eae0e-5456-418c-ad49-1cc04f072ff6/permissions
```

A prepared [batch](sharepoint-app-grants-batch.json) is also available. Confirm each inner response succeeds and GET the permissions again. An outer batch 200 is not proof of successful grants. Selected-list grants break inheritance; retain existing groups/users. No broad site-wide runtime grant is needed.

The original site's advanced permissions page denied the current account permission-management access. On 29 September the two grant requests returned 403; the last batch request ID was `0d228fb0-4c80-4d7b-9160-f75b5753029e`. No application grant was applied to the original site. The account could access content but not manage site permissions. No access request was sent and no existing permission entry was removed.

The new-site migration above is complete for schema, server configuration and scan destinations. The permissions read on both new lists confirms Rutesh is an owner and preserves the Owners, Members and Visitors groups. Customer Capture now has a verified write grant on each new list, alongside the four original permission entries. Prepared grant URLs and the batch target only the new lists.

## 4. Deploy and verify

Follow [deployment notes](azure-static-web-app.md) to publish frontend and API together after configuration. Verify:

- A tenant user with **no direct SharePoint access** can sign in, see pending contacts, save corrections and approve.
- Corrected values persist in AddedContacts before staging deletion; count survives refresh and is shared across users.
- Unauthenticated, expired, wrong-tenant and wrong-audience tokens cannot read or mutate data.
- Retry after a failed save/cleanup does not create a duplicate.
- Existing Microsoft browser sign-in is reused where possible; sign-out does not immediately sign the user back in.

Power Automate keeps its own connection and permissions. Dynamics stays read-only. Live approval and browser SSO behavior on this API architecture remain unverified until application admin consent is complete and the hosted tests pass.

References: [Selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview), [API claim validation](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation), [Static Web Apps managed API capabilities](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions).
