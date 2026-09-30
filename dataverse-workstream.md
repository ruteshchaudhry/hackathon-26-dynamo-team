# Dynamics work

Owner: Dynamics teammate.

Dynamics supplies a live answer to one question: **does a contact already have this sender's email address?**

The scan checks the Contact table's **emailaddress1** field. Any exact match ends processing. If no match is found, the sender can become a review suggestion. A failed lookup must stop the scan.

## Team actions

- Provide a safe existing test contact to verify the match-and-stop branch.
- Confirm the flow connection can read the development environment.
- Keep all Dynamics business data read-only. No new tables or schema changes are needed.
- If the demo is extended, confirm real property/development/premises and relationship mappings first.

AI name suggestions do not replace the email lookup. First/last-name candidate searching and automatic property matching are not implemented.

Approvals currently go to the demo contact list. A later Dynamics import must recheck duplicates and validate mandatory fields and relationships before creating anything.

Environment details are in the [technical reference](setup/technical-reference.md).
