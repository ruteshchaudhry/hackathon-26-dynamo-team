# Customer Capture

Find missing contacts from email, review their details, and approve them into a shared demo contact list.

[Open the demo](https://kind-ground-0ee249903.5.azurestaticapps.net/) and sign in with your company account. You do not need access to the underlying SharePoint site. Everyone using the demo sees the same review queue.

## Try it

1. Open **Pending review** and choose **Review**.
2. Correct the contact details. Email is required; other details are optional.
3. Choose **Approve & add**.
4. Open **Added contacts** to see the saved contact and updated total.

Pending records are removed only after the approved contact is saved. If an action fails, refresh and retry.

## What the demo uses

The scan currently uses a **sample email**, checks **live Dynamics data**, and suggests names using AI. Approved contacts are saved in the demo lists. **No contacts or relationships are created in Dynamics.**

The flow owner runs the sample scan; app users choose **Refresh records**. Real inbox scanning, daily summaries and a Scan now button are not connected yet.

## Team guides

| Guide | Who it helps |
|---|---|
| [Start here](setup/first-run.md) | Anyone presenting or testing |
| [Proposal](hackathon-proposal-rutesh.md) | Product team and reviewers |
| [App work](static-web-app-integration-workstream.md) | Rutesh / app owner |
| [Automation work](power-automate-workstream.md) | Flow owner |
| [Shared lists](sharepoint-workstream.md) | List owner |
| [Dynamics checks](dataverse-workstream.md) | Dynamics owner |
| [Latest test status](setup/flow-build-status.md) | Whole team |
| [Technical reference](setup/technical-reference.md) | Engineers setting up or deploying |

Shared design guidance: [AGENTS.md](AGENTS.md) and [TEAM-SKILLS.md](TEAM-SKILLS.md).
