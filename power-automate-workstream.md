# Automation work

Owner: flow teammate / Rutesh.

Two flows are used in the demo:

| Flow | What it does |
|---|---|
| Customer Capture - Scan sample emails | Checks the 10 test emails against Dynamics and creates suggestions for missing senders |
| Customer Capture - Contact data | Lets the app read and save shared records through the existing owner's connection |

## Scan behaviour

1. Read each entry from [test-emails.json](setup/test-emails.json), one at a time.
2. Match its sender against Dynamics **emailaddress1**.
3. If a match exists, skip that email without adding anything; continue with the next email.
4. If missing, suggest names using AI Builder and check both demo lists for duplicates.
5. Add a pending suggestion for review.

A failed Dynamics check is an error, not a missing contact. AI suggests names only; it does not decide whether the contact exists.

## What to do next

- The 10-email test confirmed five existing contacts were skipped and five missing contacts were staged.
- Confirm another scan skips a contact already approved by the app.
- When mailbox access is ready, replace the sample input with a small inbox batch and keep the same downstream steps. Confirm the connector is allowed in this environment.
- Keep Dynamics read-only.

Run the scan using **Test → Manually → Run flow**, then choose **Refresh records** in the app. Open **Test summary** in the run results to see each email's outcome. The contact-data flow runs automatically when the app needs it; it is not a separate human approval process.

Flow links and engineering details are in the [technical reference](setup/technical-reference.md). See [latest test status](setup/flow-build-status.md).
