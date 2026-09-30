# Customer Capture: hackathon proposal

Author: Rutesh Chaudhary. Updated 30 September 2026.

## The problem

Property managers email people who may be missing from Dynamics. We want a simple way to spot these contacts and check their details before adding them.

## Agreed journey

1. A flow reads the 10 test emails one at a time and checks each sender's email against Dynamics.
2. If the contact exists, it skips that email and continues the batch. If the contact is missing, AI suggests names and the flow creates a review item. Repeated emails are checked to avoid duplicates.
3. The user signs in with their company account and opens **Pending review**.
4. They check email, first name, last name, property and relationship. They can correct details or save for later.
5. **Approve & add** saves the approved contact. The pending item is removed only after saving succeeds.
6. **Added contacts** shows the saved results and total. Failed actions can be retried.

All signed-in company users share the same demo queue. They do not need SharePoint permissions. Existing Microsoft sign-in is reused where possible; Microsoft may still request account selection or verification.

## Demo boundaries

- Sample email input, live read-only Dynamics lookup, and shared pending/approved lists.
- AI suggests names; a person reviews them. Missing information is never invented.
- An existing email match ends the scan; relationship gaps for existing contacts are outside this demo.
- Email is required. Property and relationship are optional descriptions, not validated Dynamics links.
- Approval is a simulated addition. No Dynamics contacts, relationships or new tables are created.
- The scan runs manually; the app has **Refresh records**.
- No admin screens, invitations, Process 1/2/3 screens, rejection workflow or daily summaries.

Multiple inboxes and properties remain a future requirement. Approved demo contacts could feed a later Dynamics import after another duplicate check and validation.

## Team handoff

Rutesh owns the app and integration. Separate guides cover [automation](power-automate-workstream.md), [shared lists](sharepoint-workstream.md) and [Dynamics checks](dataverse-workstream.md).

This is the current engineering demo scope. The product team's [Miro board](https://miro.com/app/board/uXjVHgjEWWg=/) has not been changed; reconcile any differences before extending the demo.
