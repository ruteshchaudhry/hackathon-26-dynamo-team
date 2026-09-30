# Demo status — 30 September 2026

## Working and checked

- Sample email → live Dynamics email check → AI name suggestion → pending review item.
- Repeating the sample scan avoids a second pending suggestion. Repeating it after approval also skipped creation, keeping the approved contact without restaging it.
- Company sign-in works in the hosted app and reuses the current Microsoft session.
- Shared records load through the existing flow owner's connection. The app does not request user SharePoint access.
- A correction saved to the real demo list; an outdated edit was rejected.
- Hosted approval saved Alex Morgan with the reviewed property description, removed the pending item and showed **1 approved contact**.
- The approved contact and total remained after reloading the app.
- A fresh fictional Jordan Taylor email passed the same live scan and created a new pending suggestion for the next demo.
- Unsigned requests to read or approve records are rejected.
- **34 app checks and 3 batch-loader checks pass**, covering sign-in, validation, duplicate protection, outdated edits, failed saves and cleanup retries.

The new **Customer Capture - Contact data** flow is active. This route does not depend on the previously outstanding Graph application consent.

## JSON batch test

The scanner now uses all 10 entries in [test-emails.json](test-emails.json), one at a time. The first batch processed all 10: **5 existing contacts skipped and 5 new review suggestions created**. The matching branch now has a live test: it skips only that email and continues the batch.

The repeat run processed all 10: **5 existing contacts skipped, 5 already queued suggestions skipped, and 0 duplicates created**. The app displayed the five new suggestions alongside the earlier Jordan sample. Two AI name suggestions remained blank for manual review.

The flow contains a loaded copy of the file. Updating GitHub alone does not change the flow; the owner must reload the fixture using the [batch setup command](technical-reference.md#refresh-the-email-test-batch).

## Still outside the demonstrated path

- Real mailbox ingestion, scheduled scans, daily summaries and a Scan now button.
- Name-based contact search and automatic property/relationship matching.
- A second company account without site access has not been tested. The app only requests its own API scope and uses the owner's connection for data.
- Failure/retry and competing-reviewer scenarios have automated coverage; deliberate live service failures were not introduced.

Dynamics business records and schemas remain unchanged. Approvals are saved demo contacts, not Dynamics additions.

See [presentation steps](first-run.md), [automation work](../power-automate-workstream.md) and [technical reference](technical-reference.md).
