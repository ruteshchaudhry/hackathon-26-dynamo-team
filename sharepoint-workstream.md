# SharePoint storage workstream: Customer Capture POC

**Owner:** SharePoint/storage teammate, to be assigned.

**Consumers:** Power Automate owner and Rutesh.

**Status:** Proposed field contract to configure and verify; no lists are created by this document.

## Create two lists

Create **ContactStaging** and **AddedContacts** in https://randrltd.sharepoint.com/sites/PRJ_Nabo/. Check for existing lists before creating them. Share their site/list IDs and actual internal column names with both implementation owners. These are SharePoint Lists, not Excel files in a document library.

| List | Purpose |
|---|---|
| ContactStaging | Pending suggestions, processing state, and failures awaiting retry |
| AddedContacts | Durable approved demo results, used to prevent repeat simulated additions |

Use SharePoint as the single demo store. CSV and Excel are not required. No custom Dataverse storage is needed.

## Shared contact and source fields

The names below describe the contract; agree actual internal names and types before implementation.

| Fields | Suggested type / meaning |
|---|---|
| Email, NormalizedEmail, FirstName, LastName | Text; normalised email used for matching |
| TargetType, TargetId, TargetLabel | Text; preserve Dynamics target identity and display label |
| DevelopmentId, PropertyId, PremisesId | Text where the real Dynamics model requires these additional references |
| RelationshipCode, RelationshipLabel | Existing role value and display label |
| ExistingDynamicsContactId | Text, optional; only an actual Dynamics contact ID |
| SourceMailbox, SourceMessageId, RecipientAddresses | Text; provenance, with recipients stored consistently |
| ReceivedAt, Subject, EvidenceExcerpt | Date/time and text; short evidence only |
| AssignedReviewerId | Trusted Entra user identity permitted to review the item |
| CandidateKey | Flow-generated stable key for normalised email + complete target identity + role |

CandidateKey must include all target references needed by the real relationship model. Incomplete suggestions need a provisional key derived from mailbox/message/candidate identity; resolve the final business key before approval. Retain source identity separately so re-reading the same message does not reproduce an edited suggestion.

## ContactStaging fields

| Fields | Meaning |
|---|---|
| Status | Pending, Processing, Failed, or CleanupPending |
| ErrorMessage | Actionable processing or validation failure |
| ResultItemId | AddedContacts item ID once the durable outcome exists |

Use the built-in list item ID and modification/version metadata. Pending entries are editable through the approved integration action; processing entries must not be edited mid-operation.

## AddedContacts fields

| Fields | Meaning |
|---|---|
| SourceStagingId | Stable reference to the original suggestion, even after deletion |
| DemoContactId | Stable demo identity reused for the same email when no Dynamics contact exists |
| Outcome | SimulatedAddition or AlreadyExists |
| SimulatedContactCreated | Yes/no; false for an existing Dynamics or demo contact |
| SimulatedRelationshipCreated | Yes/no; false when the relationship already exists |
| ApprovedBy, ApprovedAt | Validated reviewer identity and approval time |

Each item represents an approved contact-property-role outcome. Multiple rows may share the same real or demo contact identity. These are not multiple new people. The UI labels AlreadyExists outcomes separately from simulated additions.

Enforce unique final CandidateKey values in AddedContacts and a unique SourceStagingId where supported by the chosen column types. Test these constraints. Use the same candidate key in staging to prevent repeated pending suggestions. Preserve approved results for the demo; do not delete them during staging cleanup.

## Access and integration

- [ ] Grant the automation connection the list read/write permissions needed for processing.
- [ ] Grant selected R&R reviewers read access to their permitted staging and outcome records; normal reviewers do not write directly to AddedContacts.
- [ ] Enforce reviewer/item access in SharePoint and the flow action, not only through frontend filters. For one shared demo queue, document exactly which pilot users may see it.
- [ ] Coordinate delegated API permissions and tenant consent for the frontend's Microsoft Graph list reads.
- [ ] Supply example JSON records and the field/status mapping to Rutesh.
- [ ] Test duplicate constraints, API reads, access denial, and save-before-delete behaviour with the flow owner.

Related handoffs: [Dynamics mappings](dataverse-workstream.md), [Power Automate](power-automate-workstream.md), [frontend](static-web-app-integration-workstream.md).

Reference: [SharePoint list actions in Power Automate](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers).
