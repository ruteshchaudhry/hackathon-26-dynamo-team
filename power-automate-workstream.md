# Power Automate workstream: Customer Capture POC

**Owner:** Power Automate teammate, to be assigned.

**Scope:** Read Outlook, query live Dynamics, and create SharePoint suggestions. No Dynamics writes.

## Dependencies and build order

Use the [SharePoint field contract](sharepoint-workstream.md), [Dynamics read mappings](dataverse-workstream.md), and [frontend contract](static-web-app-integration-workstream.md).

The SharePoint columns are configured. Use the actual list IDs and internal field names in [sharepoint-schema.json](setup/sharepoint-schema.json); AddedContacts uses `TargetID`, `DevelpmentId`, and `PremiseId` internally. Do not recreate the lists. The next milestone is the manual five-message scan in [first-run setup](setup/first-run.md#3-manual-scan-flow-first-path-verified).

1. Start with the manually triggered **Customer Capture - Scan sample emails** flow in the existing **Odevo Hackathon 2026** solution in environment `ae00c6cc-145f-41ea-bf30-1f0979a559c6` (Pre Dev). Use a Compose action containing [sample-email.json](setup/sample-email.json), so mailbox access is not a dependency.
2. Prove one synthetic email through live Dynamics lookups into ContactStaging, then expand to a bounded batch of five. Mock email input does not mean mock CRM results.
3. Hand off ContactStaging records to the static app; it saves approvals directly into AddedContacts.
4. Verify rescans skip records already approved by the app, including corrected emails using source mailbox/message identity.

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

## Approval belongs to the static app

Do not build a second approval flow. The browser uses delegated Graph access to save corrections, create an approved contact in AddedContacts, confirm the durable result and delete staging. See [frontend integration](static-web-app-integration-workstream.md). Dynamics is queried during scanning only; browser approval does not recheck or write Dynamics.

The current app exposes **Refresh records**. It does not yet invoke the scan flow; run the existing manual flow in the designer for the demo. A future Scan now endpoint must use authenticated calls and verified browser CORS. Never embed a secret-bearing anonymous trigger URL.

## Handoff and acceptance

- [ ] Test an existing Dynamics email and confirm termination before AI/staging.
- [ ] Test failed Dynamics queries: no false missing-contact result.
- [ ] Confirm rescanning an approved source message does not recreate staging even when the PM corrected the email.
- [ ] Verify scan → app review → corrected AddedContacts record → staging removal → refreshed count.
- [ ] Verify scan concurrency and actual unique-key rejection.
- [ ] Replace synthetic input with the authorised inbox connector when ready.

A future Dynamics import can consume AddedContacts as the approved source. That is a separate later integration, requiring fresh exact-email checks, validated mappings and import status; do not add Dynamics writes to this demo scan.

References: [SharePoint actions](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers).
