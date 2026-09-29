# Power Automate workstream: Customer Capture POC

**Owner:** Power Automate teammate, to be assigned.

**Scope:** Read Outlook, query live Dynamics, and process SharePoint suggestions and simulated additions. No Dynamics writes.

## Dependencies and build order

Use the [SharePoint field contract](sharepoint-workstream.md), [Dynamics read mappings](dataverse-workstream.md), and [frontend contract](static-web-app-integration-workstream.md).

The SharePoint columns are configured. Use the actual list IDs and internal field names in [sharepoint-schema.json](setup/sharepoint-schema.json); AddedContacts uses `TargetID`, `DevelpmentId`, and `PremiseId` internally. Do not recreate the lists. The next milestone is the manual five-message scan in [first-run setup](setup/first-run.md#3-manual-scan-flow-first-path-verified).

1. Start with the manually triggered **Customer Capture - Scan sample emails** flow in the existing **Odevo Hackathon 2026** solution in environment `ae00c6cc-145f-41ea-bf30-1f0979a559c6` (Pre Dev). Use a Compose action containing [sample-email.json](setup/sample-email.json), so mailbox access is not a dependency.
2. Prove one synthetic email through live Dynamics lookups into ContactStaging, then expand to a bounded batch of five. Mock email input does not mean mock CRM results.
3. Prove edit/approval processing into AddedContacts, including retry and cleanup.
4. Connect authenticated browser actions and verify the complete demo journey.

The Outlook connection is configured by the team. Signing into the web app does not automatically connect the user's mailbox. There are no invitation, reminder, digest, or admin flows in this scope.

When inbox access arrives, replace the sample input with Outlook.com Get emails (V2) for `testpmdyno-mine@outlook.com`. Verify connector policy then. Map each real message to the same input shape and retain its real source identity; never reuse the sample message ID for live mail. `DEMO-001` and `Resident` in the fixture are unverified reference text, not real Dynamics IDs or role codes. Resolve them through the actual schema or leave the suggestion incomplete for review.

**Build status:** [Verified live flow and remaining work](setup/flow-build-status.md). Checklists below include unfinished end-to-end requirements.

## Flow 1: Scan inbox

- [ ] Expose Scan now through the verified authenticated action contract below; use a manual designer run while building it.
- [ ] Restrict the flow to the configured demo mailbox/folder and approved pilot callers.
- [ ] Use Outlook.com Get emails (V2) for a bounded sample batch, including read messages. Capture sender, recipients, mailbox, source message ID, received time, subject, and a short excerpt.
- [ ] Start with explicit sample property identifiers and role labels. Use the available AI Builder **Extract standard entities** action for name evidence. Run a prompt is not listed in Pre Dev; Azure OpenAI is not the selected route. See [AI extraction guidance](setup/email-extraction-prompt.md). Filter irrelevant/internal messages using agreed sample rules; do not treat every sender as a customer.
- [ ] Query `contacts` using `emailaddress1`, then branch on `length(body('List_rows')?['value'])`. A failed query is an error, not proof of absence. Existing-contact relationship gaps are outside the current scope.
- [ ] Check AddedContacts and ContactStaging by normalised sender email and source mailbox/message before adding a suggestion. For this contact-only stage, CandidateKey is the normalised sender email (validate length <= 255); reuse the same key in both lists.
- [ ] Stage only senders absent from `Contact.emailaddress1`. If any exact email match exists, terminate successfully before AI or SharePoint writes. Preserve uncertain names/target/role for review.
- [ ] Return counts for scanned messages, new suggestions, skipped candidates, and errors. Describe this as a sample batch scan, not a complete mailbox audit.

Serialise scan runs for this one-inbox POC and use unique keys to handle repeated triggers. Query approved demo data as well as Dynamics on every scan because Dynamics never receives the simulated additions.

## Flow 2: Save edits, approve, and retry

The authenticated action receives a staging item ID, its expected version, and only the editable contact/target fields. Derive the reviewer from validated identity, not a browser-supplied reviewer name. Re-read the item, check access, and reject stale versions or changes to a processing item.

- **Save edits:** Validate and save allowed fields on a pending suggestion. Keep unknown values pending. Recompute its candidate key and detect collisions.
- **Approve:** Validate required email, resolved target references, and role; recheck Dynamics and AddedContacts; then process the result below.
- **Retry:** Re-read the failed/cleanup-pending item and its durable result. Resume only the missing steps. A lookup/validation failure must not authorise a simulated addition.

For approval, process one item at a time for the POC:

1. Mark the validated suggestion Processing and preserve the approved values and trusted reviewer identity.
2. Recheck live Dynamics by exact email. If found, record AlreadyExists with the actual contact ID and both creation flags false; do not simulate a missing relationship.
3. If absent, check AddedContacts by CandidateKey and SourceStagingId and reuse any durable result. Otherwise allocate a demo identity and save one SimulatedAddition outcome with the reviewed target/role and appropriate simulation flags. Do not insert a Dynamics contact.
4. Persist the approved result only once; list uniqueness and a re-read handle competing requests.
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
- [ ] Verify an exact-email match exits without staging, AI processing, or relationship additions.
- [ ] Verify repeated scans, double approvals, stale edits, response loss, failed saves, and cleanup retries.
- [ ] Verify a Dynamics lookup failure does not create a false missing-contact result.
- [ ] Verify all Dynamics operations are reads and unauthorised actions are denied.

References: [SharePoint actions](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers), [HTTP-trigger authentication](https://learn.microsoft.com/en-us/power-automate/oauth-authentication).
