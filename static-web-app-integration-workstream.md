# Static web app and API: Customer Capture

**Owner:** Rutesh. **Stack:** HTML, CSS, vanilla JavaScript, MSAL, JavaScript Azure Functions and Microsoft Graph. Frontend and managed API are hosted together on Azure Static Web Apps Free.

## Access and user journey

Every signed-in user in the configured tenant can review the shared queue. Users require no SharePoint site/list permission. The browser calls `/api/contacts`; the server alone accesses SharePoint using an application credential. No roles, invitation screens, reviewer assignments or per-user SharePoint checks.

1. Reuse an existing work-account browser session where possible. Fall back to Microsoft's sign-in interaction only when required; avoid repeated redirect loops and respect sign-out.
2. Display **Pending review**. **Refresh records** loads changes from scanning or other reviewers.
3. Review email, first name, last name, optional property and relationship descriptions.
4. **Save for later** saves corrections. **Approve & add** saves them, confirms the version, marks processing and creates the approved contact.
5. Read back the saved contact before deleting its pending record with an eTag. Failed additions retain pending review; cleanup failures can be retried without a duplicate.
6. **Added contacts** shows corrected records; the count includes all saved rows with SimulatedContactCreated=true, independent of filtering.

The app's labels, notices and errors use plain contact-review language. Do not expose SharePoint, Graph, Dataverse, backend configuration or implementation details in user-facing copy. Microsoft owns its sign-in screens and may require account selection, consent or MFA.

## Implementation

| Component | Responsibility |
|---|---|
| frontend/live-app.js | Review UI and MSAL sign-in |
| frontend/session.mjs | Silent SSO, one automatic redirect, explicit sign-out handling |
| frontend/api-store.mjs | Same-origin API calls; no Graph scopes, credentials or list IDs |
| api/lib/auth.mjs | Verify signed v2 access tokens, audience, tenant, scope and caller |
| api/lib/handler.mjs | Fixed read/save/approve operations; validate inputs and derive reviewer from token |
| api/lib/graph-token.mjs | Server credential exchange, cached Graph application token |
| api/lib/sharepoint-store.mjs | Graph list operations, version checks, duplicate protection and durable save-before-delete |

The three operations are `GET /api/contacts`, `POST /api/contacts/save` with `{expected:{id,eTag},fields}`, and `POST /api/contacts/approve` with `{expected:{id,eTag}}`. Requests require an Entra API bearer token in `X-Capture-Authorization`; the standard Authorization header is rewritten by the hosting gateway and is not used for user identity. IDs/credentials come from server settings; callers cannot select arbitrary lists or set approval metadata. Correction accepts only email, names and property/relationship labels. The server rereads authoritative records before approval.

Changing descriptions clears stale Dynamics IDs. Unique CandidateKey in both lists and SourceStagingId in AddedContacts remain essential for concurrent requests. Processing items cannot be edited. Conflicting approvals retain records for investigation. ApprovedBy is a verified Entra object ID; site owners/automation can still edit the lists, so this is not an immutable audit system.

No approval flow or approval-time Dynamics query is added. Scanning remains a manual designer-run Power Automate flow. The UI refreshes its results; Scan now is not connected.

## Setup, testing and status

See [Entra/backend access](setup/entra-access.md), [server settings](setup/backend-settings.example.json) and [deployment](setup/azure-static-web-app.md). The frontend and API are deployed. API scope and server settings are configured. Anonymous read and approval calls return 401. Application admin consent remains pending; the two list grants are complete; no live approval has been claimed.

```sh
npm ci --prefix api
npm test --prefix api
```

Tests cover signed-token validation, authentication before storage, forged reviewer/list input, app-token exchange/cache, silent sign-in behavior, corrected values, duplicate protection, concurrency, lost create responses, cleanup retries, stale versions and pagination. They use synthetic data and simulated Graph responses; they do not prove cloud consent or grants.

Offline sample mode remains available by setting frontend/config.js mode to demo locally and serving frontend with Python. It is distinct from the live integration and needs no Microsoft service connection. Live sign-in has only the hosted redirect.

## Remaining acceptance

- [x] Configure API scope and server credential, and deploy frontend/API.
- [x] Apply and verify the two SharePoint list grants.
- [ ] Obtain Graph application admin consent.
- [ ] Sign in as a tenant user without SharePoint access and verify the complete review journey.
- [ ] Verify two browsers share approved contacts and the persisted count.
- [ ] Verify repeated original emails do not recreate staging after an email correction.
- [ ] Verify silent browser sign-in, required interactive fallback and sign-out in the hosted environment.

Storage owner handles list schema/grants; Power Automate owner handles ingestion; Dynamics owner handles read-only mappings. A future Dynamics import must recheck duplicates and validate required names and real target/role IDs.
