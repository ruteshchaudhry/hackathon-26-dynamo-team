# Static web app and integration workstream: Customer Capture POC

**Owner:** Rutesh Chaudhary.

**Scope:** HTML, CSS, vanilla JavaScript, organisational SSO, and integration with SharePoint and Power Automate.

## Current implementation

The `frontend/` folder contains the local sample-data review app with editing, approval, search, repeat-scan protection, and added contacts. It uses browser storage and clearly identifies simulated operations. Live SSO and service adapters remain to be built. Follow [first-run setup](setup/first-run.md).

SharePoint columns are now configured and list IDs are recorded in frontend/config.js. Use [sharepoint-schema.json](setup/sharepoint-schema.json) for the live adapter's field mappings, including the three different internal names in AddedContacts. This configuration does not connect the demo app to SharePoint.

## Ownership

- **Rutesh:** Frontend, sign-in, list reads, flow action calls, result display, and end-to-end integration.
- [SharePoint owner](sharepoint-workstream.md): Two lists, field mappings, permissions, and duplicate constraints.
- [Power Automate owner](power-automate-workstream.md): Outlook connection, live Dynamics queries, staging, validated edits/approvals, and cleanup.
- [Dynamics owner](dataverse-workstream.md): Existing schema mappings and read-only access.

Rutesh does not create Dataverse tables or implement cloud flows. Dynamics is queried live by the flows; the frontend does not need a Dynamics write connection.

## Build the simple journey

| View/control | Behaviour |
|---|---|
| Login | Organisational Microsoft SSO for selected R&R users |
| Pending review | Read permitted ContactStaging items; show pending, processing, and failed entries |
| Scan now | Request the configured inbox scan and refresh the queue after a verified result |
| Edit | Correct email, names, target property/development/premises, and relationship |
| Approve selected | Submit valid items and show each result independently |
| Retry | Request safe retry for a failed operation or staging cleanup |
| Added contacts | Display AddedContacts outcomes, clearly identifying simulated additions and AlreadyExists results |

Use one review screen and an added-contacts view. Remove admin, invitations, reminders, onboarding, Process 1/2/3 screens, rejection controls, and digest-specific routes from the implementation plan.

Do not invent unknown names or property matches. Require valid email, resolved target references, and a relationship before approval. Keep unreviewed or incomplete records pending. Show short source evidence and the configured demo mailbox where useful.

Use **Added to demo contacts**, never **Created in Dynamics**. An existing contact with a simulated new relationship must not appear as a newly created person. Show loading, empty, denied-access, expired-session, validation, processing, failure, and success states with accessible labels and keyboard focus.

## Stack and local development

Build with HTML, CSS, vanilla JavaScript modules, and MSAL.js for sign-in. Use simple hash routes such as `#/review` and `#/added`. Separate sample-data and live adapters; label fixtures and simulated sign-in clearly.

From the dedicated frontend folder once created:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000`. Python only serves frontend files; flows and SharePoint handle data. Live sign-in, Dynamics lookups, and flow execution need internet access.

Use Azure Static Web Apps Free if team hosting is available, or the local demo machine. Register the actual hosted and localhost redirect URLs in the Entra SPA configuration. Validate hosting and integration separately; static hosting does not provide Power Automate or Dynamics entitlements.

## Integration contract

| Frontend method | Backing operation |
|---|---|
| loadPending / loadAdded | Authenticated Microsoft Graph reads of permitted list items |
| scanInbox | Authenticated Power Automate scan action for the configured mailbox |
| saveSuggestion | Authenticated flow action with editable fields and expected item version |
| approveSuggestion | Authenticated flow action with staging ID, expected version, and reviewed values |
| retrySuggestion | Authenticated flow action using the saved failure/result state |

Use the [SharePoint field contract](sharepoint-workstream.md). The flow performs all mutations and authoritative validation. Reviewers need list read access; the automation connection writes outcomes and deletes successful staging items.

- [ ] Obtain the tenant/client IDs, exact redirect URLs, site/list IDs, internal column names, and approved delegated permissions.
- [ ] Configure single-tenant SSO and selected-user access with the identity owner. Enforce permissions in SharePoint and flow actions, not only in the UI.
- [ ] Obtain verified action endpoints, token audience/scopes, request/response examples, error formats, and browser CORS behaviour from the flow owner.
- [ ] Use the correct token for each API audience. Do not reuse a Microsoft Graph token for a differently protected endpoint.
- [ ] Handle stale versions by reloading and asking the user to review the current record instead of overwriting it.
- [ ] Refresh pending and added records after processing. Identify durable outcomes by SourceStagingId/result ID; disappearance from staging alone is not success evidence.
- [ ] On request timeout, show an unknown outcome and check persisted results before offering a safe retry.
- [ ] Disable duplicate submissions while a request is pending, while retaining backend duplicate protection.
- [ ] Keep secrets and anonymous secret-bearing flow URLs out of frontend code and Git.

HTTP-trigger authentication and browser access are integration dependencies to prove, not assumed capabilities of the local static server. If a relay is required, agree and document it before implementing it. A manually run scan is a labelled temporary fallback, not completion of Scan now.

## Delivery checks

- [ ] Deliver frontend source, a non-secret configuration example, and local startup instructions.
- [ ] Demonstrate sign-in, live scan, correction, approval, and added demo records with the configured services.
- [ ] Verify multiple properties per contact, repeat scans/approvals, failed saves, cleanup retries, stale updates, and denied access with the other owners.
- [ ] Confirm pending records disappear only after a durable outcome and failed records remain reviewable.
- [ ] Confirm the UI accurately distinguishes simulated additions from existing Dynamics data.
- [ ] Confirm no admin screens or Dynamics writes are included.

References: [Microsoft Graph list items](https://learn.microsoft.com/en-us/graph/api/resources/listitem?view=graph-rest-1.0), [Power Automate authenticated triggers](https://learn.microsoft.com/en-us/power-automate/oauth-authentication), [Python static file server](https://docs.python.org/3/library/http.server.html).
