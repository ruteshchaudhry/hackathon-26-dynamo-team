# R&R Inbox Contact Discovery

**Author:** Rutesh Chaudhary

**Status:** Simplified hackathon scope, updated 29 September 2026. Implementation handoff; services have not been provisioned by this document.

## 1. Problem and objective

Property managers communicate with contacts through Outlook, but some contacts and their relationships to properties are missing from Dynamics. Demonstrate discovering those gaps, reviewing suggestions, and approving simulated additions.

Power Automate reads Outlook and checks Dynamics through live API calls. SharePoint stores both pending suggestions and approved demo records. Dynamics is read-only throughout the POC: no new Dataverse tables, schema changes, or contact/relationship writes.

## 2. Agreed user journey

1. An authorised R&R user signs into the static web app using organisational Microsoft SSO.
2. The user sees pending suggestions and can choose **Scan now** for the one configured demo inbox.
3. Power Automate reads a bounded batch of sample emails, captures sender and recipients, and extracts explicit property references and relationship labels.
4. The flow queries live Dynamics contacts, existing relationships, and property/development/premises records. It also checks pending and previously approved demo records to avoid repeat suggestions.
5. Missing contacts or relationships become records in the **ContactStaging** SharePoint List. An existing contact can still need a relationship to another property.
6. The user reviews and corrects email, names, target property/development/premises, and relationship, then approves selected records. Uncertain or incomplete entries remain pending.
7. Power Automate rechecks live Dynamics and the approved demo records. Required simulated additions are saved in **AddedContacts**; nothing is written to Dynamics.
8. The staging entry is removed only after its durable outcome has been recorded. Failed entries remain available for retry. The UI displays **Added to demo contacts** for simulated additions and **Already exists** when the recheck finds no work left.
9. The user can open **Added contacts** to see approved demo outcomes.

## 3. Data and responsibilities

| Component | Responsibility |
|---|---|
| Outlook | Source emails from one team-configured inbox |
| Dynamics / Dataverse | Live, read-only source of existing contacts, relationships, properties/developments, and premises |
| Power Automate | Inbox reading, parsing, live comparison, staging, validated approvals, duplicate checks, and cleanup |
| SharePoint ContactStaging | Pending review and failed processing records |
| SharePoint AddedContacts | Approved demo contact/relationship outcomes and durable duplicate detection |
| Static web app | SSO, pending review, edit and approve, scan control, results, and added contacts |

The PM-facing fields are email, first name, last name, property/development/premises, and relationship to the property. Keep the actual Dynamics IDs alongside display labels. Supporting fields retain mailbox, source message ID, recipients, time, a short supporting excerpt, reviewer, processing status, and errors.

Do not invent missing names or roles. Ambiguous contact or property matches require correction before approval. One contact can have different relationships across several properties; duplicate detection must preserve these distinctions.

Use two SharePoint Lists as the agreed storage. Do not implement CSV or Excel databases.

## 4. POC boundaries

Use one configured Outlook inbox, synthetic sample emails, and existing sample data in the Dynamics development environment. Sample messages contain explicit property identifiers and role labels; AI extraction is not required.

Build only login, pending review, editing, approval, Scan now, and added demo contacts. Exclude admin dashboards, invitations, reminders, self-service mailbox onboarding, the former Process 1/2/3 screens, rejection workflows, and daily/weekly digests. Scheduled scanning and organisation-wide rollout are outside this demo scope.

The general data model still permits multiple inboxes per property and multiple properties per inbox or contact.

## 5. Demonstration checks

- [ ] A new sender produces a pending suggestion after a live Dynamics lookup.
- [ ] Approval creates the simulated result in AddedContacts and removes staging only after success.
- [ ] An existing Dynamics contact receives a simulated missing relationship without being treated as a new contact.
- [ ] The same contact can have different property relationships.
- [ ] Missing or ambiguous information can be corrected before approval.
- [ ] Repeated scans, approval clicks, and retries do not duplicate pending or approved records.
- [ ] A failed save preserves staging; a cleanup failure does not repeat the successful addition.
- [ ] A record added independently to Dynamics between scan and approval is recognised and reported accurately.
- [ ] Unauthorised users cannot read review data or trigger actions.
- [ ] Dynamics data and schemas remain unchanged.

## 6. Delivery and remaining inputs

Rutesh builds HTML, CSS, and vanilla JavaScript with organisational SSO. Serve the frontend locally using Python's static file server; use Azure Static Web Apps Free if hosting is available. The Python server serves files only; cloud flows perform processing.

The team must supply the demo inbox/folder, Dynamics read-only mapping and connection, SharePoint site/list IDs and fields, approved pilot users, Entra configuration, and a verified authenticated web-app-to-flow contract. Validate browser access and required platform entitlements before the live integration demo.

Implementation tasks are split into [frontend and integration](static-web-app-integration-workstream.md), [Power Automate](power-automate-workstream.md), [SharePoint](sharepoint-workstream.md), and [Dynamics read-only access](dataverse-workstream.md).

This simplified engineering scope supersedes the earlier proposal's process screens and Dataverse staging design. The product team's [Miro board](https://miro.com/app/board/uXjVHgjEWWg=/) is unchanged; share this revision with the product team for alignment.
