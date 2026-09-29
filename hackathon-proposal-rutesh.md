# R&R Inbox Contact Discovery

**Author:** Rutesh Chaudhary  
**Status:** Proposal for team review  
**Purpose:** Capture the agreed hackathon scope for reconciliation with the Product Director’s requirements before implementation.

## 1. Problem and objective

Property managers communicate with contacts through Outlook, but some contacts and their relationships to properties are missing from Dynamics.

The solution will collect relevant email information into a separate Dataverse staging table. Property managers will review the suggestions and approve them before contacts or relationships are created in Dynamics.

This is a hackathon POC focused on a simple, demonstrable journey.

## 2. Agreed user journey

1. An authorised R&R user signs into the static web app using organisational Microsoft SSO.
2. Power Automate scans the configured inbox every **15 minutes**. The web app also provides **Scan now**.
3. Sender and recipient information is captured. Missing contacts or relationships become staging records.
4. The system uses explicit property references and relationship labels in sample emails to suggest matches.
5. The PM receives a **daily Outlook summary**, grouped by property and sender, linking to the web app.
6. In the web app, the PM reviews and corrects the suggested information, then approves selected records.
7. Power Automate rechecks Dynamics and creates only the missing contact and relationship.
8. The staging record is deleted only after all required Dynamics operations succeed. Failed records remain available for investigation and retry.

Approvals happen in the web app. The daily email provides a summary and review link.

## 3. Data and integrations

Reuse the existing Dynamics tables:

- Contact.
- Contact Relationship.
- Property/Development.
- Premises.

Create **one custom Dataverse staging table** for scraped data awaiting review. Do not introduce replacement property or relationship tables.

The PM-facing fields are:

| Field | Agreed behaviour |
|---|---|
| Email | Sender’s email; used to find an existing contact |
| First name | Extract when available; otherwise leave blank |
| Last name | Extract when available; otherwise leave blank |
| Property / Development / Premises | Identify and select the correct existing Dynamics record |
| Relationship to the property | Select the existing relationship type or role |

Retain supporting information behind the scenes: recipient addresses, source mailbox, email identifier, timestamp, subject, short supporting excerpt, existing contact match, review status, reviewer, and processing error.

Missing names or relationships must not be invented. Uncertain property matches require PM review.

**Technology direction:**

- Outlook provides the source emails and daily summary delivery.
- Power Automate handles scanning, staging, summaries, and approved Dynamics writes.
- Dataverse stores the staging records and existing business data.
- The static web app communicates with Dataverse and initiates Power Automate scanning.
- Microsoft Entra SSO restricts access to selected R&R users with the required Dataverse permissions.

## 4. Hackathon scope and demonstration

Use **one Outlook inbox**, sample emails, and sample records in the **Dynamics development environment**.

Use explicit property identifiers and role labels to make the demo predictable. AI extraction is not required for this POC.

Demonstrate:

- A missing contact and relationship being suggested and created after approval.
- An existing contact receiving a missing relationship without creating another contact.
- A contact associated with more than one property.
- Missing information being corrected before approval.
- Repeated scans and approvals avoiding duplicate contacts and relationships.
- Successful processing removing the staging record.
- A failed operation preserving the staging record for retry.
- An unauthorised user being denied access.

The wider requirement remains many-to-many: multiple inboxes can concern the same property; an inbox can concern multiple properties; a contact can have different relationships across properties. Organisation-wide mailbox rollout is outside the POC.

## 5. Details to confirm with the team

These are implementation inputs, not changes to the agreed functional scope:

- Dynamics dev environment URL and existing table/column mappings.
- Mandatory Contact and Contact Relationship fields.
- How relationships reference Property, Development, and Premises records.
- Test mailbox, sample emails, and approved R&R users.
- Power Automate entitlements, Outlook/Dataverse connections, Entra app registration, and static hosting.
- Daily summary delivery time.
- Secure web-app-to-flow triggering and persistent duplicate detection after staging records are deleted.
- Treatment of rejected suggestions and retention of processing history.

The team will configure the required platform access. This proposal should be reconciled with the Product Director’s requirements before implementation.
