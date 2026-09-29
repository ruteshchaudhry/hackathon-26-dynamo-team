# Static web app and integration workstream: Customer Capture POC

**Owner:** Rutesh Chaudhary.

**Scope:** Single-page UI and integration with the team's Dataverse/Power Automate implementation.

**Status:** Engineering handoff; this document does not create application code or deploy services.

## Ownership and dependencies

The product team owns Miro's Process 1, Process 2, and Process 3. Implement those journeys as three views in one application.

- [Dataverse owner](dataverse-workstream.md): tables, existing CRM mappings, permissions, and sample CRM records.
- [Power Automate owner](power-automate-workstream.md): mailbox connections, flows, background work, email delivery, and status reporting.
- **Rutesh:** frontend, SSO integration, Dataverse API client, flow-request submission, progress display, and end-to-end integration testing.

Rutesh does not implement Dataverse schema changes or Power Automate flows. Agree missing backend behaviour with its owner rather than implementing a second processing system in the UI.

Source journeys: [Process 1](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685369284605), [Process 2](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685369571110), [Process 3](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685370564089).

## Stack and local development

- [ ] Build the UI with HTML, CSS, and vanilla JavaScript modules; no frontend framework is required.
- [ ] Use MSAL.js for Microsoft sign-in rather than implementing OAuth manually.
- [ ] Serve the frontend folder with Python's static file server during development. Python serves the files; it is not the backend for scans, approvals, or emails.
- [ ] Use hash-based views such as `#/audit`, `#/review`, and `#/admin` so the same static files can run locally and on static hosting without route-rewrite dependencies.
- [ ] Separate sample-data and live Dataverse adapters behind the same frontend methods. Clearly label sample-data mode and simulated operations.
- [ ] Keep required demo assets available locally if an offline sample-data demonstration is needed.

Run from the dedicated frontend folder once it exists:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000`. Do not serve the entire repository or folders containing credentials. Live Entra sign-in, Dataverse, and Power Automate still require internet access.

## Build the three views

| View | Actions and states |
|---|---|
| Process 1: Initial audit | Invitation landing, sign-in, actual configured inbox status, Scan now, queued/running progress, suggestion review, accept/edit/reject, completion and retry feedback |
| Process 2: Weekly review | Digest-link landing, pending suggestions, accept all valid suggestions, edit, reject with reason, complete review, per-item write outcomes |
| Process 3: Admin monitoring | Invite approved pilot users, invitation status, connection status, audit progress, select users and request reminders |

- [ ] Reuse the contact-review UI across the initial and weekly review flows.
- [ ] Display email, first name, last name, property/development/premises as required by the actual schema, and relationship type. Show short source evidence where useful.
- [ ] Leave unknown values blank, explain missing required fields, and prevent incomplete suggestions from being submitted for creation.
- [ ] Save edits and review decisions explicitly. Digest links select a view or intended action; they never approve records simply by opening.
- [ ] Require a reason for rejection. Preserve unresolved suggestions in the queue.
- [ ] Show empty, loading, permission-denied, expired-session, validation-error, failed-write, and successful-completion states.
- [ ] Provide keyboard access, visible focus, labelled fields, readable errors, and status text that does not rely only on colour.

For the POC, show the one real team-configured mailbox accurately. If self-service mailbox connection is not implemented by the integration team, show its actual configured/pending state rather than a simulated Connect success.

## Live integration contract

Use [the Dataverse handoff](dataverse-workstream.md) as the shared contract. Its names are conceptual until the Dataverse owner publishes logical names, entity sets, lookup navigation properties, and numeric choice values.

| UI action | Integration behaviour |
|---|---|
| Load suggestions | Authenticated Dataverse query for permitted Suggestion rows only |
| Scan now | Create an authorised Request row of type Scan; observe its status and refresh suggestions when finished |
| Save edits | Update editable suggestion fields with conflict detection to avoid overwriting another reviewer's changes |
| Submit approvals | Mark valid, selected suggestions approved using the agreed trigger contract; display processing results |
| Reject | Save Rejected decision and reason; no CRM creation request |
| Invite / Remind | Create the corresponding Request only for authorised admins; read actual delivery/progress results |
| Retry | Use the backend owner's documented retry action; do not force-reset flow-controlled states |

- [ ] Use authenticated `fetch()` calls to Dataverse with the signed-in user's access token.
- [ ] Poll requests/processing state while relevant views are open, handle errors, and stop polling when work completes or the user leaves. Reopening the view must recover the current server state.
- [ ] Distinguish submission, processing, and success. A successful request save is not a successful CRM write, and a disappearing staging record alone is not proof of completion.
- [ ] Do not put client secrets, privileged connection credentials, or secret-bearing Power Automate URLs in JavaScript, URLs, or Git.
- [ ] Keep tenant ID, client ID, environment URL, redirect URLs, and the schema mapping in non-secret configuration.

The Python server does not enforce Dataverse permissions or replace the cloud flows. Business-data access and privileged actions must be checked by Dataverse/automation, not only by UI controls.

## SSO and hosting

- [ ] Coordinate a single-tenant Entra SPA registration, delegated Dataverse permission, selected R&R user assignment, and Dataverse security roles with the environment/identity owner.
- [ ] Register the actual localhost and hosted redirect URLs used by MSAL, including any redirect page required by the selected library version.
- [ ] Host the static build on **Azure Static Web Apps Free** when team access is ready. MSAL runs in the application; Static Web Apps' built-in custom authentication feature requires Standard.
- [ ] Treat the static application shell as publicly downloadable. Enforce selected-user data access and admin privileges in the backing services.
- [ ] Use the local demo machine if cloud hosting is unavailable. Digest/invitation links must use that machine's local application URL for the demonstration; localhost links opened on other machines point to those other machines.

## Deliverables and completion checks

- [ ] Commit the frontend and sample data with one-command local startup instructions and a non-secret configuration example.
- [ ] Demonstrate all three product views with labelled sample data while backend work proceeds.
- [ ] Integrate the real SSO and Dataverse staging table after the contract is delivered.
- [ ] Trigger a real scan from the UI and display its verified completion.
- [ ] Approve a sample contact/relationship, verify the actual Dynamics outcome and staging cleanup, and display a failed-write/retry case.
- [ ] Verify rejection reasons, duplicate prevention, unauthorised access, and admin-only action enforcement with the other owners.
- [ ] Confirm the same frontend works from the local server and, if provisioned, Static Web Apps Free.

## Decisions and sequencing

Build the sample-data UI first. The Dataverse owner publishes the contract next; the flow owner proves scan and approval behaviour; Rutesh then connects and tests the live end-to-end journey.

Weekly digest is the current product direction. Scan frequency and the existing-contact/missing-relationship branch remain product decisions; expose the confirmed behaviour consistently rather than choosing different defaults in the UI and flows.

References: [Dataverse JavaScript SPA](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/quick-start-js-spa), [Static Web Apps custom authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-custom), [Python local file server](https://docs.python.org/3/library/http.server.html).
