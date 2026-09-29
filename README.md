# Customer Capture — hackathon POC

A simple contact-review app: Power Automate reads one Outlook inbox, checks live Dynamics data, and stores suggestions in SharePoint. An authorised pilot user reviews and approves suggestions in a static web app. Approved records go to a second SharePoint List to simulate adding contacts. Dynamics remains read-only.

**Current build stage:** Use a manually triggered flow with [synthetic email JSON](setup/sample-email.json) until test-inbox access is available. Live Dynamics lookup, AI Builder name extraction and SharePoint staging have passed the missing-contact and repeated-scan tests. See [flow build status](setup/flow-build-status.md) for verified results and remaining work. No external mock email service is required; the demo must label its email source as simulated.

## Current scope and team ownership

| Document | Owner / purpose |
|---|---|
| [Proposal](hackathon-proposal-rutesh.md) | Current agreed journey, scope, and demo checks |
| [Static web app and integration](static-web-app-integration-workstream.md) | Rutesh: HTML, CSS, JavaScript, SSO, and integration |
| [Power Automate](power-automate-workstream.md) | Flow teammate: inbox scan, live lookups, AI extraction and staging |
| [SharePoint storage](sharepoint-workstream.md) | Storage teammate: ContactStaging and AddedContacts lists, permissions, and field mapping |
| [Dynamics read-only integration](dataverse-workstream.md) | Dynamics teammate: existing API mappings and read access; no schema changes |

A local sample-data app is now available in `frontend/`. The frontend is still in sample-data mode; its new Entra/Graph adapter awaits approved tenant configuration and live verification. Approval will write corrected contacts directly to AddedContacts, then remove staging and refresh the shared count. No second flow is needed. See [the access plan](setup/entra-access.md). Follow [the first-run setup guide](setup/first-run.md) to run the app and configure the services in order.

## Hosted demo

[Open Customer Capture on Azure](https://kind-ground-0ee249903.5.azurestaticapps.net/). Hosted on the Free Static Web Apps plan; current sample-data mode still uses each browser’s local storage. See [deployment and redeployment notes](setup/azure-static-web-app.md).

## Run the local demo

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://localhost:8000 and choose **Open sample-data demo**. It uses fictional records stored only in that browser. Review, edit, approve, and rescan sample suggestions; approvals appear in Added contacts. No real mailbox or Dynamics records are changed.

Run `node --test tests/*.test.mjs` for the store checks.

The app retains the deep blue, light blue and magenta palette, with a generic Customer Capture name and no organisation logos. Theme values live in `frontend/styles.css`. Configured tenant service URLs are retained for integration.

## Get started

```sh
git clone https://github.com/ruteshchaudhry/hackathon-26-dynamo-team.git
cd hackathon-26-dynamo-team
```

Open the repository in Codex. Read the proposal and your workstream before implementation. Start with synthetic sample emails and Dynamics development records.

Shared design guidance remains in [AGENTS.md](AGENTS.md) and [TEAM-SKILLS.md](TEAM-SKILLS.md); preserve the complete `.agents/skills` folders.
