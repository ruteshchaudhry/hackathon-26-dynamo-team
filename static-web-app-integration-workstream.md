# Static web app and integration: Customer Capture

**Owner:** Rutesh. **Stack:** HTML, CSS, vanilla JavaScript, locally bundled MSAL.js, Microsoft Graph. Azure Static Web Apps Free or Python's local static file server.

## Current implementation

The frontend now has separate sample-data and live adapters. Live mode supports single-tenant Entra sign-in, SharePoint reads, edited staging saves, direct approval into AddedContacts, staging cleanup and an approved-contact count. No approval flow is needed.

**Activation is pending:** the Entra registration, consent, selected-list grants and pilot assignment need approval/configuration. `frontend/config.js` stays in `demo` mode with an empty client ID. No live browser sign-in or approval has been verified yet. See [the exact access plan](setup/entra-access.md).

The 15 automated store tests cover corrected values, save failures, lost responses, cleanup retry, duplicate protection, stale versions, concurrent reviewers and pagination. They use simulated Graph responses; they do not prove tenant configuration. A separate local browser test also verified corrected Alexander Morgan values, staging dropping from 1 to 0 and approved count increasing from 0 to 1, with no console errors. It used test authentication and simulated Graph responses outside the repository; those substitutes are not deployed. Run `node --test tests/*.test.mjs`.

## User journey

1. Sign in using the configured organisation account.
2. Load ContactStaging and AddedContacts from SharePoint. **Refresh records** fetches changes made by the scan flow or another reviewer.
3. Review and correct email, first name, last name, property description and relationship description. Email is required; descriptions are optional in this contact-only demo. Unknown Dynamics IDs remain blank. Changing a description clears stale associated IDs.
4. **Save for later** updates staging. **Approve & add** saves edits, confirms the current version, marks processing and creates one approved contact in AddedContacts.
5. Read back the durable approved contact, then delete staging using its expected version. A failed save leaves staging. A failed delete leaves a recoverable cleanup item.
6. Open **Added contacts** and see the saved corrected values. **Approved contacts created** counts persisted AddedContacts rows with SimulatedContactCreated=true across all pages, independent of search filtering. It does not count Dynamics creations.

Processing and cleanup items are locked for editing in this UI. Retry finishes the saved approval without another contact. Duplicate-email conflicts from different suggestions retain staging for investigation. SharePoint unique CandidateKey and SourceStagingId columns are essential; buttons alone do not prevent duplicates.

## Integration boundaries

| Operation | Implementation |
|---|---|
| Sign-in | MSAL, tenant-specific authority, authorization code + PKCE, session cache |
| Shared reads | Graph list items with pagination; no record cache in localStorage |
| Save corrections | Graph PATCH of allowed fields with If-Match |
| Approve | Graph POST to AddedContacts, durable read-back, then conditional DELETE from ContactStaging |
| Retry | Find existing outcome by SourceStagingId before any repeated creation |
| Scan | Existing Power Automate designer run; browser has Refresh, not a connected Scan now action |
| Dynamics | Read-only lookup in the scan flow; no approval-time Dynamics query or write |

Use the verified list IDs and internal field mappings in [sharepoint-schema.json](setup/sharepoint-schema.json). Keep credentials and anonymous flow URLs out of the frontend. The app uses delegated `Lists.SelectedOperations.Selected` and proposed write grants on just the two lists; the signed-in reviewer also needs appropriate SharePoint access. This is a shared demo queue, not item-level PM isolation.

Direct list editing is a demo trust model: authorised reviewers can change list records outside the UI too. ApprovedBy is filled from the signed-in account, but is not an immutable audit mechanism. A production approval process needs server-enforced validation and audit.

## Handoff

- Rutesh: frontend, Graph adapter, Entra integration, deployment and complete browser test.
- SharePoint owner: grant the approved access, retain unique constraints, verify live API behavior.
- Power Automate owner: ingestion, exact Dynamics email comparison, AI name suggestions and staging only.
- Dynamics owner: mappings for a later approved-contact import; no Dynamics writes in this demo.

Run locally from the repository root with `python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend`. Both the hosted URL and localhost must be registered redirects. Microsoft sign-in requires internet access.

## Live acceptance still required

- [ ] Sign in as the assigned pilot and load the real staged synthetic email.
- [ ] Edit the contact, approve, confirm corrected AddedContacts fields, staging removal and count after reload.
- [ ] Verify two browsers see the same records.
- [ ] Verify permission denial, session expiry, actual unique-key conflicts and cleanup retries.
- [ ] Verify the existing flow's source-message duplicate check still suppresses the original email after an approved email correction.

References: [selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview), [conditional field updates](https://learn.microsoft.com/en-us/graph/api/listitem-update?view=graph-rest-1.0).
