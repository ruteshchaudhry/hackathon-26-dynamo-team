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

These documents describe the simplified POC and replace the earlier onboarding, admin, and digest implementation scope. They are handoffs, not evidence that the app, lists, or flows have been deployed.

## Get started

```sh
git clone https://github.com/ruteshchaudhry/hackathon-26-dynamo-team.git
cd hackathon-26-dynamo-team
```

Open the repository in Codex. Read the proposal and your workstream before implementation. Start with synthetic sample emails and Dynamics development records.

Shared design guidance remains in [AGENTS.md](AGENTS.md) and [TEAM-SKILLS.md](TEAM-SKILLS.md); preserve the complete `.agents/skills` folders.
