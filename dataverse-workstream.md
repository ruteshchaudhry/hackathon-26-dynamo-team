# Dynamics work

Owner: Dynamics teammate.

Dynamics supplies a live answer to one question: **does a contact already have this sender's email address?**

The scan checks the Contact table's **emailaddress1** field. An exact match skips that email; the remaining batch still runs. If no match is found, the sender can become a review suggestion. A failed lookup must not create a suggestion; the batch run reports the failure.

## Team actions

- The 10-email batch verified five existing-contact matches; those senders were skipped. Keep future test data approved for this development environment.
- Confirm the flow connection can read the development environment.
- Keep all Dynamics business data read-only. No new tables or schema changes are needed.
- If the demo is extended, confirm real property/development/premises and relationship mappings first.

AI name suggestions do not replace the email lookup. First/last-name candidate searching and automatic property matching are not implemented.

Approvals currently go to the demo contact list. A later Dynamics import must recheck duplicates and validate mandatory fields and relationships before creating anything.

Environment details are in the [technical reference](setup/technical-reference.md).
