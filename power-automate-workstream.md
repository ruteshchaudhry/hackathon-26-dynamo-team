# Automation work

Owner: flow teammate / Rutesh.

Two flows are used in the demo:

| Flow | What it does |
|---|---|
| Customer Capture - Scan sample emails | Checks a sample sender against Dynamics and creates a suggestion when missing |
| Customer Capture - Contact data | Lets the app read and save shared records through the existing owner's connection |

## Scan behaviour

1. Read the sample email.
2. Match its sender against Dynamics **emailaddress1**.
3. If a match exists, stop without adding anything.
4. If missing, suggest names using AI Builder and check both demo lists for duplicates.
5. Add a pending suggestion for review.

A failed Dynamics check is an error, not a missing contact. AI suggests names only; it does not decide whether the contact exists.

## What to do next

- Test the existing-contact branch with an approved Dynamics test contact.
- Confirm another scan skips a contact already approved by the app.
- When mailbox access is ready, replace the sample input with a small inbox batch and keep the same downstream steps. Confirm the connector is allowed in this environment.
- Keep Dynamics read-only.

Run the scan from its designer, then choose **Refresh records** in the app. The contact-data flow runs automatically when the app needs it; it is not a separate human approval process.

Flow links and engineering details are in the [technical reference](setup/technical-reference.md). See [latest test status](setup/flow-build-status.md).
