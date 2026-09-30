# How AI helps

The scan uses **AI Builder: Extract standard entities** to suggest names from the sample email. It is not a custom chat prompt.

Dynamics is checked first using the sender's actual email address. If that contact exists, the scan stops. AI only runs for a missing sender.

The current name rule accepts a person-name result matching the sender's display name and splits a two-part name. Other name formats stay blank for review. This is a suggestion and can be wrong; the reviewer must check it against the email evidence.

AI must never invent missing details, approve a contact, change destinations, or write to Dynamics. Name searching and automatic property matching are not implemented.

The Alex Morgan sample passed extraction. See [test status](flow-build-status.md) and [Microsoft's entity extraction guide](https://learn.microsoft.com/en-us/ai-builder/prebuilt-entity-extraction).
