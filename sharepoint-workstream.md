# SharePoint storage workstream: Customer Capture POC

**Owner:** SharePoint/storage teammate, to be assigned.

**Consumers:** Power Automate owner and Rutesh.

**Status (30 September 2026):** Both lists copied to Customer Capture Demo. Graph metadata confirms the copied internal names, defaults and unique keys. The retargeted live scan created one synthetic Pending Alex Morgan record. Azure backend IDs now point to the new lists. Application admin consent remains pending; the two list grants are complete; end users need no SharePoint permissions. The original site/lists remain untouched.

## Configured lists

Use **ContactStaging** and **AddedContacts** in https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/ (site display name: Customer Capture Demo). These are SharePoint Lists, not Excel files in a document library. The verified IDs and complete internal-name/type inventory are in [sharepoint-schema.json](setup/sharepoint-schema.json).

- [ContactStaging](https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/Lists/ContactStaging/AllItems.aspx): `f3785741-154d-47ba-978c-74251305d71f`.
- [AddedContacts](https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/Lists/AddedContacts/AllItems.aspx): `356eae0e-5456-418c-ad49-1cc04f072ff6`.

### Integration details verified during setup

AddedContacts has three corrected display labels whose existing internal names remain different. Map them explicitly in API payloads:

| Contract/display name | AddedContacts internal name | ContactStaging internal name |
|---|---|---|
| TargetId | TargetID | TargetId |
| DevelopmentId | DevelpmentId | DevelopmentId |
| PremisesId | PremiseId | PremisesId |

CandidateKey is required and unique in both lists. SourceStagingId is required and unique in AddedContacts. Status defaults to Pending. Outcome is required with choices SimulatedAddition and AlreadyExists; both simulated-creation flags default to No.

RecipientAddresses and EvidenceExcerpt are plain multiline text; store recipients as a JSON array of strings. ReceivedAt and ApprovedAt include time; send ISO 8601 UTC values. Other text fields, including the existing ErrorMessage, are single-line text (255 characters). Keep errors concise. Validate key and identifier lengths; never silently truncate identity keys. Agree a deterministic compact key encoding before implementing the flows if the full business/source key exceeds 255 characters.

List configuration and sequential duplicate scan checks are verified. Concurrent unique-key rejection and live approval retries remain untested. Backend app-only read checks currently return HTTP 401 while application admin consent is absent. Existing user/group permissions were preserved; the two lists now have selected application write grants. The list-specific application grants are applied and verified; see [access plan](setup/entra-access.md).

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
| AssignedReviewerId | Optional provenance field; not enforced for this shared demo queue |
| CandidateKey | For the current contact-only scan: normalised sender email, maximum 255 characters |

For the current contact-only scope, CandidateKey is the normalised sender email, so repeated messages for one missing contact reuse one pending suggestion. Preserve source mailbox/message separately so an edited email does not reproduce the original suggestion. Property/role fields remain available for PM review; existing-contact relationship-gap ingestion is outside scope. The list column's generic description predates this narrower rule; flow logic follows this document.

## ContactStaging fields

| Fields | Meaning |
|---|---|
| Status | Pending, Processing, Failed, or CleanupPending |
| ErrorMessage | Actionable processing or validation failure |
| ResultItemId | AddedContacts item ID once the durable outcome exists |

Use the built-in list item ID and modification/version metadata. Pending entries are editable through the app’s server-side Graph adapter; processing entries must not be edited mid-operation.

## AddedContacts fields

| Fields | Meaning |
|---|---|
| SourceStagingId | Stable reference to the original suggestion, even after deletion |
| DemoContactId | Stable demo identity reused for the same email when no Dynamics contact exists |
| Outcome | SimulatedAddition for direct demo approval; AlreadyExists remains in the schema but is not generated by this adapter |
| SimulatedContactCreated | Yes for a newly approved demo contact; not evidence of a Dynamics creation |
| SimulatedRelationshipCreated | No for this contact-only demo; descriptions do not establish Dynamics relationships |
| ApprovedBy, ApprovedAt | Validated reviewer identity and approval time |

For the current contact-only MVP, each item represents one approved result per normalised email, retaining the reviewed target/role fields. Multiple relationship outcomes for an existing contact are outside this scan scope. The UI labels AlreadyExists outcomes separately from simulated additions.

Enforce unique final CandidateKey values in AddedContacts and a unique SourceStagingId where supported by the chosen column types. Test these constraints. Use the same candidate key in staging to prevent repeated pending suggestions. Preserve approved results for the demo; do not delete them during staging cleanup.

## Access and integration

- [x] Grant the automation connection the list read/write permissions needed for processing (scan tested).
- [x] Grant the backend application write access to only ContactStaging and AddedContacts. Users do not need direct SharePoint permissions.
- [ ] Keep a shared demo queue: every user able to sign in to the single-tenant app can review all suggestions. No reviewer roles, invitations or item-level isolation.
- [ ] Coordinate Microsoft Graph **application** Lists.SelectedOperations.Selected consent and the backend credential, kept in Azure server settings.
- [ ] Supply example JSON records and the field/status mapping to Rutesh.
- [ ] Test duplicate constraints, API reads, access denial, and save-before-delete behaviour with the frontend owner.

Related handoffs: [Dynamics mappings](dataverse-workstream.md), [Power Automate](power-automate-workstream.md), [frontend](static-web-app-integration-workstream.md).

Reference: [SharePoint list actions in Power Automate](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers).

## Future Dynamics source

Retain AddedContacts after staging cleanup. It can feed a later Dynamics import/flow, which must recheck email, validate mandatory fields and real target/role IDs, and record import status/result IDs. No import runs in the current demo. The backend sets ApprovedBy from the validated Entra token and ApprovedAt on the server. Site owners/automation can still edit list items; this is not an immutable production audit trail.
