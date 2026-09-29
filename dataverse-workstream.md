# Dataverse workstream: Customer Capture POC

**Owner:** Dynamics/Dataverse teammate, to be assigned.

**Consumer:** Power Automate owner and Rutesh (static web app and integration).

**Status:** Engineering handoff for team review. Suggested fields below are a proposed contract, not deployed schema.

## Responsibility and boundaries

Own Dataverse configuration, schema mapping, permissions, sample CRM data, and solution packaging. Rutesh will consume the agreed API contract; he is not responsible for Dataverse changes.

Reuse the existing Contact, Contact Relationship, Property/Development, and Premises tables. Create only **one custom table** for this POC. Preserve existing business schemas and data.

Related handoffs:

- [Power Automate workstream](power-automate-workstream.md)
- [Static web app and integration workstream](static-web-app-integration-workstream.md)
- [Original proposal and product journey links](hackathon-proposal-rutesh.md)

The product team's Miro processes govern onboarding, weekly review, and admin monitoring. Older daily-summary wording in the original proposal is superseded by the weekly journey.

## Actions

- [ ] Confirm the development environment URL and create/use a shared **Customer Capture POC** solution.
- [ ] Map the existing business tables, primary keys, email/name fields, property references, relationship target lookups, role values, and mandatory fields.
- [ ] Confirm whether Property/Development and Premises are separate relationship targets or related records that must both be populated. Do not assume one generic lookup can replace the actual model.
- [ ] Agree the single custom table contract below with the flow owner and Rutesh, then create it in the solution.
- [ ] Configure Dataverse access for selected R&R pilot users, administrators, and the automation connection identity.
- [ ] Seed synthetic data covering a new contact, an existing contact, an existing relationship, multiple properties, and missing/ambiguous information.
- [ ] Publish a mapping of display names to logical names, Web API entity-set names, lookup navigation properties, choice numeric values, and required fields.
- [ ] Export the solution and provide setup/import instructions and connection requirements to the team. Do not commit credentials or access tokens.

## Proposed single-table contract

Use a `Record kind` discriminator so this one table can contain **Suggestion** rows and **Request** rows. This avoids introducing a separate job table solely to trigger flows. The table owner must confirm this approach before implementation; field labels below are conceptual, not invented logical names.

All suggestion screens and digest queries must explicitly filter to `Record kind = Suggestion`. Request rows are operational records and must never appear as contacts to approve.

### Suggestion rows

| Field/group | Purpose and write ownership |
|---|---|
| Row ID and Record kind | Dataverse identity; fixed row kind |
| Sender email, first name, last name | Proposed contact details; PM can correct before submitting |
| Recipient addresses and source mailbox | Communication context captured by the flow |
| Source message identifier and received time | Traceability and repeated-ingestion checks |
| Subject and short evidence excerpt | Minimum information needed for review; no attachments or full mailbox dumps |
| Property/development/premises reference(s) | Lookups mapped to the existing Dynamics model; PM can correct |
| Relationship type | Existing permitted role/type; PM can correct |
| Matched contact ID | Existing contact, if found; set by automation |
| Review decision | Pending, Approved, Rejected; chosen by an authorised reviewer |
| Rejection reason | Required when rejecting |
| Processing status | Pending, Processing, Completed, Failed; controlled by automation |
| Review attribution and time | Derive from trusted Dataverse change/audit information; do not trust a browser-supplied reviewer name |
| Result contact/relationship IDs and error | Preserve partial progress and retry information |
| Owner/assigned reviewer | Determines the permitted review scope |

Missing names, target records, or roles remain unresolved until review. Required values must be validated before approval is processed. Lowercase and trim email addresses for matching; an exact email match does not guarantee a unique Dynamics record.

### Request rows

| Field/group | Purpose and write ownership |
|---|---|
| Request ID and Record kind | Dataverse identity; Request row |
| Request type | Scan, Invite, or Remind |
| Created By / Created On | Trusted requester identity and request time |
| Target | Configured demo mailbox for scanning; approved pilot user for invitation/reminder |
| Request status | Queued, Running, Completed, Failed; automation-controlled |
| Started/finished time, counts, error | Progress for the UI |
| Invitation/connection/audit progress | Map supported progress fields for Process 3; successful email delivery alone is not an inbox connection or completed audit |

Only administrators can submit Invite/Remind actions. Scan targets are restricted to the configured POC mailbox. The flow must validate requests server-side; the browser cannot choose arbitrary mailboxes or recipients.

Request rows can retain operational progress after successful suggestion rows are deleted. Request retention and rejection retention require team agreement; do not delete these rows under the approved-suggestion cleanup rule.

## Permissions, processing, and duplicate handling

- [ ] Agree reviewer ownership/team access and the admin role. Enforce these in Dataverse and flow-side validation, not only through hidden buttons.
- [ ] Restrict edits to operational fields, result IDs, and trusted approval attribution. Use appropriate Dataverse security and flow validation; document the controls actually configured.
- [ ] Define a stable ingestion key from mailbox, message identity, and any additional candidate/target discriminator required by the sample data. Keep multiple legitimate property relationships distinct.
- [ ] Retain rejected suggestions and their reasons for the POC so rescanning the same source does not immediately resurrect them.
- [ ] After successful suggestion deletion, repeat scans must check the current contact and relationship state before proposing the same work again. Agree any additional durable deduplication metadata with the flow owner within the single-table constraint.
- [ ] Retain failed suggestions and partial result IDs until a successful retry. Never delete before both required CRM writes succeed.

## Handoff required before live UI integration

Provide the environment URL, the completed schema mapping, choice values, sample row IDs, permitted role values, assigned user IDs, required API privileges, and working examples of a Suggestion row and each Request type. Include how the UI reads an approval outcome after the successful suggestion has been deleted.

Do not provide secrets in these documents. Entra application registration and user assignment require coordination with the tenant administrator; Rutesh needs the non-secret tenant ID, client ID, and registered redirect URLs.

## Completion checks

- [ ] An authorised pilot user can read and edit their permitted pending suggestions; an unauthorised user cannot access them.
- [ ] Normal PM users cannot issue admin invitations or reminders, or tamper with flow-controlled outcomes.
- [ ] Requests and suggestions are distinguishable through API queries.
- [ ] All required existing table/lookup mappings have been tested against the dev environment.
- [ ] Synthetic records cover both properties and premises according to the actual relationship model.
- [ ] The flow owner and Rutesh have acknowledged the same field/status mapping.

## Product decisions still open

The MVP Scope diagram skips senders already in Dynamics, while Process 1 includes missing contact relationships. Confirm whether existing-contact/missing-relationship suggestions belong in the MVP before finalising that branch. Scan frequency is also unconfirmed. These decisions must be shared across all three workstreams.
