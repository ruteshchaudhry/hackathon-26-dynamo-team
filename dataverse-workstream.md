# Dynamics read-only workstream: Customer Capture POC

**Owner:** Dynamics teammate, to be assigned.

**Consumers:** Power Automate owner and Rutesh.

## Responsibility

Provide live read access and mappings for the existing Dynamics development data. The existing filename is retained for team links; this workstream no longer creates a staging table or makes any Dynamics changes.

Power Automate queries Dynamics at scan time and again during approval. Approved demo results are stored in SharePoint, never in Dynamics. A Dynamics query failure must stop processing with a visible error; it must not be interpreted as a missing contact.

## Actions

- [x] Verify the development environment URL and connection through a successful contact read.
- [x] Verify Contact entity set `contacts` and fields `contactid,firstname,lastname,emailaddress1` with a live read.
- [ ] Map Contact Relationship, its contact reference, target references, and role values.
- [ ] Map existing Property/Development and Premises IDs, names, explicit identifiers, and their relationships.
- [ ] Explain whether a relationship requires multiple target references; do not replace the actual model with an assumed generic property ID.
- [ ] Identify existing synthetic demo records covering a known contact, an existing relationship, and multiple properties. A new sender can be represented by a sample email without creating a Dynamics record.
- [ ] Provide tested read-only lookup examples, including no match, one match, multiple matches, and API failure.
- [ ] Coordinate connection access and entitlements with the flow owner. Do not commit secrets or tokens.

## Matching contract

**Confirmed by Rutesh:** match the sender email against `contact.emailaddress1` first. The initial live query uses entity set `contacts`, selects `contactid,firstname,lastname,emailaddress1`, and is limited to two rows. Sender email is trimmed/lowercased and apostrophes escaped in the OData value.

- One or more exact email matches: exit the scan successfully with no staging or relationship addition.
- Zero exact email matches: proceed to AI-assisted extraction, duplicate checks and pending review.
- Lookup failure: fail visibly; never treat it as zero matches.

AI Builder Extract standard entities supplies name evidence. Proposed `firstname`/`lastname` candidate queries are advisory, bounded and only needed for missing-email cases. Name-only matches must never count as a confirmed identity or suppress staging. Do not write model-generated OData directly into a query.

Property, development, premises and role mapping is still required for reviewing new contacts. Existing-contact relationship discovery is outside the current scope.

Verified development organisation from the successful contact lookup: `https://rendallandrittner-predev.crm11.dynamics.com`. No Dynamics business records were modified.

## Handoff and validation

Deliver the environment URL, logical names, entity sets, relevant field/lookup mappings, allowed role values, sample target IDs, and read-query examples. These must match the [SharePoint contract](sharepoint-workstream.md) and [Power Automate implementation](power-automate-workstream.md).

- [ ] Verify live reads from the flow connection against the configured sample records.
- [ ] Verify the flow never invokes a Dynamics create, update, or delete operation.
- [ ] Verify no custom Dataverse tables or schema changes are required.

Reference: [Query the Dataverse Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview).
