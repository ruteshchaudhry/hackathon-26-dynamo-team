# R&R Inbox Contact Discovery

**Author:** Rutesh Chaudhary  
**Status:** Proposal for team review  
**Purpose:** Capture the agreed hackathon scope for reconciliation with the Product Director’s requirements before implementation.

## 1. Problem and objective

Property managers communicate with contacts through Outlook, but some contacts and their relationships to properties are missing from Dynamics.

The solution will collect relevant email information into a separate Dataverse staging table. Property managers will review the suggestions and approve them before contacts or relationships are created in Dynamics.

This is a hackathon POC focused on a simple, demonstrable journey.

## 2. Agreed user journey

Aligned with the Miro [MVP Scope](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685363306144) and the three process diagrams, reviewed on 29 September 2026.

### A. First-time inbox audit

1. An administrator adds an authorised R&R user's email address to the audit list and sends an invitation to the **Customer Capture** tool.
2. The user follows the invitation, signs into the static web app using organisational Microsoft SSO, and connects their authorised Outlook inbox. The POC uses one configured demo inbox.
3. The user starts the initial audit. The web app initiates Power Automate scanning, captures sender and recipient details, and compares sender email addresses with existing Dynamics contacts.
4. The tool checks whether a new sender is relevant for a **customer** contact relationship before collecting further details. It proposes email, first name, last name, property/development, premises, and relationship type. For the POC, sample emails contain explicit property references and role labels; missing or uncertain values remain for user review.
5. Suggestions are stored in the custom Dataverse staging table and displayed in the web app. If there are no suggestions, the audit can complete without creating records.
6. The user reviews each suggestion and chooses **Accept**, **Edit**, or **Reject**. Editing returns the corrected details to review. Rejection requires a reason, which the platform records; rejected suggestions do not create Dynamics records.
7. The platform writes only accepted contacts and relationships to Dynamics, rechecking for duplicates before each write. Successfully processed staging records are deleted; failed records remain available for retry. The initial audit is complete when all suggestions have been resolved and approved writes have succeeded.

Source: [Process 1: First-time inbox audit](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685369284605).

### B. Ongoing capture and weekly review

1. Power Automate continues capturing relevant email information into the staging table. **Scan timing is to be agreed**, as marked in Miro; the earlier 15-minute interval is a proposal, not a confirmed MVP requirement. **Scan now** remains the proposed manual control for the web app and hackathon demonstration.
2. At the end of each week, staged suggestions are compared with Dynamics again to identify records that have already been created since capture and avoid duplicate suggestions.
3. The user receives a **weekly Outlook digest** containing suggested contacts and contact relationships. Its **Accept all**, **Edit**, and **Reject** calls to action open the web app; following an email link does not itself approve or create records.
4. In the web app, the user accepts all valid suggestions, edits and approves corrected suggestions, or rejects suggestions with reasons. Any undecided suggestions remain in the review queue until resolved.
5. When the user completes the review, Power Automate rechecks Dynamics and creates only approved, missing contacts and relationships. The app distinguishes successful writes from failures; only successfully processed staging records are deleted.

Source: [Process 2: Weekly contact review](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685369571110).

### C. Admin invitations and monitoring

An authorised administrator signs in, invites one or more R&R users by email, and monitors pending invitations, successful inbox connections, and completed audits. The administrator can select users and send reminders. This provides the usage-monitoring panel identified in the MVP scope; the POC demonstrates it with the configured demo user/inbox.

Source: [Process 3: Admin invitations and monitoring](https://miro.com/app/board/uXjVHgjEWWg=/?moveToWidget=3458764685370564089).

### Alignment points for team review

- **Digest cadence:** Miro specifies a weekly digest. This journey supersedes the earlier daily-summary proposal; the other sections of this document have not been revised in this section-only update.
- **Existing contacts:** The MVP Scope gateway ends processing when an email address already exists in Dynamics, while the initial-audit diagram includes missing contact relationships. The team needs to confirm whether suggesting a missing relationship for an existing contact is in the MVP. Existing contacts must not be recreated in either case.
- **Rejections:** Miro requires a rejection reason to be recorded. The retention and repeat-suggestion rules remain to be agreed; rejection must not be treated as approval or successful creation.

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
