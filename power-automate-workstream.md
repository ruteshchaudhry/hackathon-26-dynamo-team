# Power Automate workstream: Customer Capture POC

**Owner:** Power Automate teammate, to be assigned.

**Consumer:** Rutesh (static web app and integration).

**Status:** Engineering handoff; flows have not been built or deployed by this document.

## Responsibility and dependencies

Own Outlook/Dataverse connections, the cloud flows, server-side validation, execution status, error handling, and solution export. Rutesh owns the UI and its API calls, not flow creation or maintenance.

Use the field/status contract in [Dataverse workstream](dataverse-workstream.md). Coordinate UI payloads and results with [Static web app and integration workstream](static-web-app-integration-workstream.md). Product journeys and source links are in the [proposal](hackathon-proposal-rutesh.md).

Build in the Dynamics **development environment**, using one authorised demo inbox and synthetic emails. Keep all flows and connection references in **Customer Capture POC**. The Outlook connection is configured by the team; signing into the website does not automatically create a Power Automate Outlook connection for that user.

## Build order

1. Manually test reading five sample messages and creating pending staging suggestions.
2. Replace the manual trigger with the agreed Dataverse Scan-request trigger and expose progress to the UI.
3. Implement approval processing and demonstrate one complete contact/relationship write.
4. Add the weekly digest and a designer test run for the hackathon.
5. Add admin invitation/reminder processing and progress updates.

Continuous scheduled scanning is a follow-up once product confirms the interval. Do not treat the earlier 15-minute proposal as a final requirement.

## Flow 1: Scan inbox

**Final trigger:** Dataverse row added, filtered to `Record kind = Request`, `Request type = Scan`, and `Request status = Queued`.

- [ ] Validate the trusted requester and configured demo mailbox, then set the request to Running.
- [ ] Use Outlook **Get emails (V3)** for the agreed folder and bounded sample batch. Include read messages and do not download attachments.
- [ ] For each email, capture sender email, recipients, source mailbox, message identifier, received time, subject, and a short evidence excerpt.
- [ ] Normalise the sender email and query existing Dynamics contacts. Multiple matches require review; never silently choose an arbitrary record.
- [ ] Apply the team's customer-relevance rules. The fixture set must distinguish customer messages from internal, supplier, or unrelated messages; do not equate every external sender with a customer.
- [ ] Parse the explicit property reference and role labels in sample emails and resolve them against existing Dynamics records. Do not invent missing names or relationships.
- [ ] Apply the agreed existing-contact policy, and check both current CRM state and staging rows before adding suggestions.
- [ ] Write only eligible missing-contact/relationship suggestions, with Pending review and Pending processing status. Uncertain information remains visible for correction.
- [ ] Update the request with counts, timestamps, and Completed or Failed. Do not report a truncated sample scan as a complete mailbox audit.

Use a small deterministic batch for the POC. Review connector search/paging limitations before increasing its scope. Messages moved out of the selected folder will require a separate ingestion strategy; a weekly digest is not a weekly-only inbox scan.

## Flow 2: Process approved suggestions

**Trigger:** Dataverse row modified, filtered to Suggestion rows with Review decision Approved and Processing status Pending. Select only the appropriate scalar trigger columns from the final schema.

- [ ] Re-read the current row and validate approval attribution, reviewer access, required names/email, target record(s), and relationship type.
- [ ] Set Processing and process approved rows sequentially for the POC. Repeated triggers must not create repeated writes.
- [ ] Recheck contacts by normalised email. Reuse one unambiguous match; create only when no match exists. Preserve the resulting contact ID.
- [ ] Check the actual contact-target-role relationship and create only the missing relationship. Preserve its resulting ID.
- [ ] Record the verified successful outcome and update any agreed audit/request progress before deleting the suggestion.
- [ ] Delete the suggestion only after all required operations succeed. A deletion failure must be distinguishable from a CRM creation failure.
- [ ] On failure, retain the suggestion, error, and any partial result IDs. A retry resumes safely and rechecks existing records.

The UI saves edits first and submits approvals when the user chooses to complete the review. Clicking a digest link does not change a review decision. Rejected suggestions require a reason and do not trigger CRM creation.

Use a Try scope plus failure handling configured with **Run after** for failed/timed-out actions. Publish the supported retry action to Rutesh; the frontend must not reset arbitrary processing states on its own.

## Flow 3: Weekly digest

**Trigger:** Weekly recurrence; weekday, time, and timezone require product confirmation.

- [ ] Read only pending Suggestion rows for each authorised reviewer.
- [ ] Reconcile against current Dynamics contacts and relationships, so the digest does not propose work already completed elsewhere.
- [ ] Group the remaining suggestions by reviewer and property, showing concise details and counts.
- [ ] Send the weekly Outlook email with links for Accept all, Edit, and Reject. Each opens the appropriate SSO web-app view; the email links themselves perform no write.
- [ ] Encode only the required record/review identifiers in links. Do not put access tokens, flow secrets, or email bodies in URLs.
- [ ] Use the agreed hosted URL or the exact localhost URL on the demonstration laptop. A localhost link works on the machine opening it, not remotely on another teammate's machine.

Provide a way to test-run the digest from the flow designer during the demo rather than waiting for the scheduled day.

## Flow 4: Admin invitations and reminders

**Trigger:** Dataverse Request row added with Invite or Remind type and Queued status.

- [ ] Validate administrator authority using trusted identity and permissions; never trust a browser-supplied `isAdmin` flag.
- [ ] Restrict invitation/reminder recipients to the approved R&R pilot scope.
- [ ] Send the relevant Outlook email and update request delivery outcome or error.
- [ ] Track pending invitation, successful inbox connection, and audit completion as distinct events. Do not claim the mailbox is connected just because an invitation was sent.
- [ ] Make each request safe against retries and repeated triggers; expose any delivery uncertainty rather than blindly sending duplicates.

The POC uses one team-configured mailbox connection. Product's future per-user inbox onboarding must be labelled accordingly until implemented; do not fake a live connection in the UI.

## Connection and frontend handoff

- [ ] Use solution connection references and coordinate required entitlements/permissions with the environment owner.
- [ ] Keep connection credentials and secret-bearing HTTP trigger URLs out of Git and the browser.
- [ ] Confirm request fields, accepted values, progress statuses, counts, errors, and approval/retry behaviour with Rutesh before switching from fixtures to live mode.
- [ ] Confirm where Rutesh reads completion after a suggestion is deleted; disappearance alone is not proof that the CRM writes succeeded.
- [ ] Deliver the solution export, connection-reference mapping, configured sample inbox/folder, exported flow definitions where practical, and a short runbook with verified test cases.

## Acceptance checklist

- [ ] Scan five fixture emails from the UI; progress ends in an accurate result.
- [ ] Repeating a scan does not duplicate pending suggestions or recreate already completed CRM work.
- [ ] An approved new contact gets the correct relationship; partial failure and retry do not duplicate either.
- [ ] Existing-contact relationship behaviour matches the product team's confirmed choice.
- [ ] Rejection preserves its reason and causes no CRM write.
- [ ] Weekly digest links open the correct review view and require authorised sign-in.
- [ ] Non-admin invitation requests and unauthorised mailbox/record targets are rejected server-side.
- [ ] Closing the UI during processing does not stop the cloud flow.

References: [Dataverse triggers](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger), [Outlook connector](https://learn.microsoft.com/en-us/connectors/office365connector/), [solution connection references](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-connection-reference).
