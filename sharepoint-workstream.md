# SharePoint storage workstream: Customer Capture POC

**Owner:** SharePoint/storage teammate, to be assigned.

**Consumers:** Power Automate owner and Rutesh.

**Status (29 September 2026):** Both existing lists reused and their missing columns added. Names/types and unique-key settings verified in SharePoint; the live scan created one synthetic Pending Alex Morgan item and a repeat scan skipped creation. Browser API integration and pilot permissions remain pending.

## Configured lists

Use **ContactStaging** and **AddedContacts** in https://randrltd.sharepoint.com/sites/PRJ_Nabo/ (site display name: PRJ_Dynamo Shared). These are SharePoint Lists, not Excel files in a document library. The verified IDs and complete internal-name/type inventory are in [sharepoint-schema.json](setup/sharepoint-schema.json).

- [ContactStaging](https://randrltd.sharepoint.com/sites/PRJ_Nabo/Lists/ContactStaging/AllItems.aspx): `d2285f11-09dc-462b-b692-e3111a40c23f`.
- [AddedContacts](https://randrltd.sharepoint.com/sites/PRJ_Nabo/Lists/AddedContacts/AllItems.aspx): `85fc11a7-c916-4af3-b25e-1b7346aba98a`.

### Integration details verified during setup

AddedContacts has three corrected display labels whose existing internal names remain different. Map them explicitly in API payloads:

| Contract/display name | AddedContacts internal name | ContactStaging internal name |
|---|---|---|
| TargetId | TargetID | TargetId |
| DevelopmentId | DevelpmentId | DevelopmentId |
| PremisesId | PremiseId | PremisesId |

CandidateKey is required and unique in both lists. SourceStagingId is required and unique in AddedContacts. Status defaults to Pending. Outcome is required with choices SimulatedAddition and AlreadyExists; both simulated-creation flags default to No.

RecipientAddresses and EvidenceExcerpt are plain multiline text; store recipients as a JSON array of strings. ReceivedAt and ApprovedAt include time; send ISO 8601 UTC values. Other text fields, including the existing ErrorMessage, are single-line text (255 characters). Keep errors concise. Validate key and identifier lengths; never silently truncate identity keys. Agree a deterministic compact key encoding before implementing the flows if the full business/source key exceeds 255 characters.

List configuration and sequential duplicate scan checks are verified. Concurrent unique-key rejection, pilot access, browser API reads, and approval retries remain untested. Existing site permissions were not changed.

| List | Purpose |
|---|---|
| ContactStaging | Pending suggestions, processing state, and failures awaiting retry |
| AddedContacts | Durable approved demo results, used to prevent repeat simulated additions |

Use SharePoint as the single demo store. CSV and Excel are not required. No custom Dataverse storage is needed.

## Shared contact and source fields

The names below describe the contract; use the verified inventory above for actual internal names and types.

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
| CandidateKey | For the current contact-only scan: normalised sender email, maximum 255 characters |

For the current contact-only scope, CandidateKey is the normalised sender email, so repeated messages for one missing contact reuse one pending suggestion. Preserve source mailbox/message separately so an edited email does not reproduce the original suggestion. Property/role fields remain available for PM review; existing-contact relationship-gap ingestion is outside scope. The list column's generic description predates this narrower rule; flow logic follows this document.

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

For the current contact-only MVP, each item represents one approved result per normalised email, retaining the reviewed target/role fields. Multiple relationship outcomes for an existing contact are outside this scan scope. The UI labels AlreadyExists outcomes separately from simulated additions.

Enforce unique final CandidateKey values in AddedContacts and a unique SourceStagingId where supported by the chosen column types. Test these constraints. Use the same candidate key in staging to prevent repeated pending suggestions. Preserve approved results for the demo; do not delete them during staging cleanup.

## Access and integration

- [ ] Grant the automation connection the list read/write permissions needed for processing.
- [ ] Grant selected pilot reviewers read access to their permitted staging and outcome records; normal reviewers do not write directly to AddedContacts.
- [ ] Enforce reviewer/item access in SharePoint and the flow action, not only through frontend filters. For one shared demo queue, document exactly which pilot users may see it.
- [ ] Coordinate delegated API permissions and tenant consent for the frontend's Microsoft Graph list reads.
- [ ] Supply example JSON records and the field/status mapping to Rutesh.
- [ ] Test duplicate constraints, API reads, access denial, and save-before-delete behaviour with the flow owner.

Related handoffs: [Dynamics mappings](dataverse-workstream.md), [Power Automate](power-automate-workstream.md), [frontend](static-web-app-integration-workstream.md).

Reference: [SharePoint list actions in Power Automate](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers).
