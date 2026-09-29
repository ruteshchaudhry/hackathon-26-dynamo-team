# Power Automate workstream: Customer Capture POC

**Owner:** Power Automate teammate, to be assigned.

**Scope:** Read Outlook, query live Dynamics, and process SharePoint suggestions and simulated additions. No Dynamics writes.

## Dependencies and build order

Use the [SharePoint field contract](sharepoint-workstream.md), [Dynamics read mappings](dataverse-workstream.md), and [frontend contract](static-web-app-integration-workstream.md).

1. Configure `testpmdyno-mine@outlook.com` using the Outlook.com connector and read-only Dynamics access in environment `ae00c6cc-145f-41ea-bf30-1f0979a559c6`. Verify environment connector policy permits this combination.
2. Prove a bounded scan of five synthetic emails into ContactStaging.
3. Prove edit/approval processing into AddedContacts, including retry and cleanup.
4. Connect authenticated browser actions and verify the complete demo journey.

The Outlook connection is configured by the team. Signing into the web app does not automatically connect the user's mailbox. There are no invitation, reminder, digest, or admin flows in this scope.

## Flow 1: Scan inbox

- [ ] Expose Scan now through the verified authenticated action contract below; use a manual designer run while building it.
- [ ] Restrict the flow to the configured demo mailbox/folder and approved R&R callers.
- [ ] Use Outlook.com Get emails (V2) for a bounded sample batch, including read messages. Capture sender, recipients, mailbox, source message ID, received time, subject, and a short excerpt.
- [ ] Start with explicit sample property identifiers and role labels. Once AI Builder access/capacity is verified, use the [draft extraction prompt](setup/email-extraction-prompt.md), validate its structured output, and resolve suggestions with API queries. Filter irrelevant/internal messages using agreed sample rules; do not treat every sender as a customer.
- [ ] Query live Dynamics contacts and target records, then check the actual contact-target-role relationship. A failed query is an error, not proof of absence.
- [ ] Check AddedContacts and ContactStaging for both business and source keys before adding a suggestion.
- [ ] Stage only missing contact/relationship work. Preserve uncertain fields for review rather than inventing them.
- [ ] Return counts for scanned messages, new suggestions, skipped candidates, and errors. Describe this as a sample batch scan, not a complete mailbox audit.

Serialise scan runs for this one-inbox POC and use unique keys to handle repeated triggers. Query approved demo data as well as Dynamics on every scan because Dynamics never receives the simulated additions.

## Flow 2: Save edits, approve, and retry

The authenticated action receives a staging item ID, its expected version, and only the editable contact/target fields. Derive the reviewer from validated identity, not a browser-supplied reviewer name. Re-read the item, check access, and reject stale versions or changes to a processing item.

- **Save edits:** Validate and save allowed fields on a pending suggestion. Keep unknown values pending. Recompute its candidate key and detect collisions.
- **Approve:** Validate required email, resolved target references, and role; recheck Dynamics and AddedContacts; then process the result below.
- **Retry:** Re-read the failed/cleanup-pending item and its durable result. Resume only the missing steps. A lookup/validation failure must not authorise a simulated addition.

For approval, process one item at a time for the POC:

1. Mark the validated suggestion Processing and preserve the approved values and trusted reviewer identity.
2. Query live Dynamics. If the contact exists, reuse its ID. If absent, reuse an existing demo contact identity for the email or allocate one. Do not insert a contact in Dynamics.
3. Check the complete contact-target-role key in Dynamics and AddedContacts. If a demo result already exists, reuse it. Otherwise write the approved outcome to AddedContacts with the correct simulated-contact/relationship flags.
4. If Dynamics now contains everything, record an AlreadyExists outcome with both creation flags false, so the UI can explain why no addition was needed.
5. Confirm the durable result, retain its item ID, and only then delete the staging item.
6. Return the result item ID and accurate outcome. If deletion fails, retain CleanupPending and the result ID; retry cleanup without creating another result.

Use sequential processing plus list uniqueness constraints and rechecks; do not rely on a disabled button to prevent duplicate approvals. Keep AddedContacts across rescans and retries. Handle a lost HTTP response by re-reading the durable result using SourceStagingId before repeating work.

On an earlier failure, retain staging with Failed and a useful error. Use failure handling for failed/timed-out actions. Closing the browser must not undo an accepted cloud operation.

## Browser action contract

Expose authenticated actions for `scan`, `save`, `approve`, and `retry`. Restrict callers to the configured pilot users and check access to the requested staging item. Never accept arbitrary mailbox names, Dynamics endpoints, or SharePoint destinations from the browser.

The flow owner and Rutesh must verify the tenant's HTTP-trigger authentication, token audience, browser CORS/preflight behaviour, and entitlements before finalising URLs. OAuth-protected HTTP triggers are the proposed route, not a claim of an already-working browser endpoint. Do not embed secret-bearing anonymous trigger URLs in JavaScript. If an authenticated relay is necessary, agree its hosting with Rutesh; Python's static file server is not that relay.

Publish request/response examples and errors for every action. For the small demo batch, aim to return the completed result within the request timeout. If a call times out, report an unknown outcome and refresh persisted records; do not report success. Do not promise asynchronous progress polling without a tested status endpoint and durable status contract.

If the browser trigger is not ready, a clearly labelled designer-run scan can demonstrate ingestion, but UI-triggered scan remains an incomplete acceptance item.

## Handoff and acceptance

- [ ] Provide connection setup, list mappings, action URLs/auth configuration, sample payloads, and flow exports where available.
- [ ] Verify scan → review → approve → AddedContacts → staging cleanup from the UI.
- [ ] Verify an existing contact with a missing relationship and one contact linked to multiple properties.
- [ ] Verify repeated scans, double approvals, stale edits, response loss, failed saves, and cleanup retries.
- [ ] Verify a Dynamics lookup failure does not create a false missing-contact result.
- [ ] Verify all Dynamics operations are reads and unauthorised actions are denied.

References: [SharePoint actions](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers), [HTTP-trigger authentication](https://learn.microsoft.com/en-us/power-automate/oauth-authentication).
