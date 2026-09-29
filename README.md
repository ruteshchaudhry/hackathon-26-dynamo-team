# R&R Inbox Contact Discovery — hackathon POC

A simple contact-review app: Power Automate reads one Outlook inbox, checks live Dynamics data, and stores suggestions in SharePoint. An authorised R&R user reviews and approves suggestions in a static web app. Approved records go to a second SharePoint List to simulate adding contacts and relationships. Dynamics remains read-only.

## Current scope and team ownership

| Document | Owner / purpose |
|---|---|
| [Proposal](hackathon-proposal-rutesh.md) | Current agreed journey, scope, and demo checks |
| [Static web app and integration](static-web-app-integration-workstream.md) | Rutesh: HTML, CSS, JavaScript, SSO, and integration |
| [Power Automate](power-automate-workstream.md) | Flow teammate: inbox scan, live lookups, staging, and simulated approval |
| [SharePoint storage](sharepoint-workstream.md) | Storage teammate: ContactStaging and AddedContacts lists, permissions, and field mapping |
| [Dynamics read-only integration](dataverse-workstream.md) | Dynamics teammate: existing API mappings and read access; no schema changes |

A local sample-data app is now available in `frontend/`. Microsoft SSO and the live services are not connected yet. Follow [the first-run setup guide](setup/first-run.md) to run the app and configure the services in order.

## Run the local demo

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://localhost:8000 and choose **Open sample-data demo**. It uses fictional records stored only in that browser. Review, edit, approve, and rescan sample suggestions; approvals appear in Added contacts. No real mailbox or Dynamics records are changed.

Run `node --test tests/demo-store.test.mjs` for the store checks.

## Get started

```sh
git clone https://github.com/ruteshchaudhry/hackathon-26-dynamo-team.git
cd hackathon-26-dynamo-team
```

Open the repository in Codex. Read the proposal and your workstream before implementation. Start with synthetic sample emails and Dynamics development records.

Shared design guidance remains in [AGENTS.md](AGENTS.md) and [TEAM-SKILLS.md](TEAM-SKILLS.md); preserve the complete `.agents/skills` folders.
