# Dynamics read-only workstream: Customer Capture POC

**Owner:** Dynamics teammate, to be assigned.

**Consumers:** Power Automate owner and Rutesh.

## Responsibility

Provide live read access and mappings for the existing Dynamics development data. The existing filename is retained for team links; this workstream no longer creates a staging table or makes any Dynamics changes.

Power Automate queries Dynamics at scan time and again during approval. Approved demo results are stored in SharePoint, never in Dynamics. A Dynamics query failure must stop processing with a visible error; it must not be interpreted as a missing contact.

## Actions

- [ ] Confirm the development environment URL and a connection identity with the required read privileges.
- [ ] Map Contact email, first/last name, primary key, and Web API entity-set names.
- [ ] Map Contact Relationship, its contact reference, target references, and role values.
- [ ] Map existing Property/Development and Premises IDs, names, explicit identifiers, and their relationships.
- [ ] Explain whether a relationship requires multiple target references; do not replace the actual model with an assumed generic property ID.
- [ ] Identify existing synthetic demo records covering a known contact, an existing relationship, and multiple properties. A new sender can be represented by a sample email without creating a Dynamics record.
- [ ] Provide tested read-only lookup examples, including no match, one match, multiple matches, and API failure.
- [ ] Coordinate connection access and entitlements with the flow owner. Do not commit secrets or tokens.

## Matching contract

Normalise email addresses for comparison. Return all matching contacts; multiple matches require review. Do not select an arbitrary contact or merge contacts automatically.

Check relationships using the resolved contact ID, actual target IDs/types, and role. An existing contact does not imply that every property relationship exists. Property matches must use the sample's explicit identifiers; unknown or ambiguous targets stay unresolved.

Provide the flow owner with read results that distinguish:

- Contact missing: simulate a new contact and required relationship after approval.
- Contact present, relationship missing: reuse its ID and simulate only the missing relationship.
- Contact and relationship present: no new suggestion, or an AlreadyExists outcome if discovered during approval.
- Ambiguous match or failed lookup: require correction or retry, without assuming absence.

## Handoff and validation

Deliver the environment URL, logical names, entity sets, relevant field/lookup mappings, allowed role values, sample target IDs, and read-query examples. These must match the [SharePoint contract](sharepoint-workstream.md) and [Power Automate implementation](power-automate-workstream.md).

- [ ] Verify live reads from the flow connection against the configured sample records.
- [ ] Verify the flow never invokes a Dynamics create, update, or delete operation.
- [ ] Verify no custom Dataverse tables or schema changes are required.

Reference: [Query the Dataverse Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview).
