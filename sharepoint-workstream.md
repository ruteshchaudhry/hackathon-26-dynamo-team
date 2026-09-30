# Shared contact lists

Owner: list owner / Rutesh.

The two lists are ready on [demo site](https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/). Do not recreate them.

| List | Purpose |
|---|---|
| ContactStaging | Suggestions awaiting review, plus items needing retry |
| AddedContacts | Approved demo contacts and their approval details |

Each contact includes email, names, property and relationship descriptions. Supporting details retain the source email, review status and approval information.

## Keep these rules

- The flow owner's connection needs access to both lists. App users do not.
- Email keys must stay unique. The approved list also has a unique source-review ID to prevent repeat approvals.
- Save and verify the approved record before deleting its pending copy.
- Do not delete approved records to reset the demo: scans use them to avoid duplicates.
- These lists simulate contact creation; they do not update Dynamics.

The original site's lists remain untouched. Field names and constraints are recorded in the [schema inventory](setup/sharepoint-schema.json); engineers should also read the [technical reference](setup/technical-reference.md).
