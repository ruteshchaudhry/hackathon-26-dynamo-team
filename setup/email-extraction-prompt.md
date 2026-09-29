# AI name extraction for the contact-discovery flow

**Selected route:** AI Builder **Extract standard entities**, using the existing Dataverse connection. This replaces the proposed custom-prompt route for the current build. `Run a prompt` is absent from Pre Dev's action catalogue. Azure OpenAI is not required for this selected route.

## Processing order

1. Normalise the actual sender email and query `Contact.emailaddress1` live.
2. If any exact email match exists, exit without staging or AI processing.
3. For missing senders, run Extract standard entities over the synthetic sender display name, subject and plain-text body, using English.
4. Check pending and approved SharePoint results for duplicates. The current flow calls AI before these checks; moving duplicate checks earlier is a future cost optimisation.
5. Retain person-name evidence for the PM. The implemented filter requires `type=PersonName` and a value equal to the sender display name. Exactly two space-separated tokens become suggested first/last names; other shapes remain blank. This split is a heuristic, so the PM must verify it.
6. Optional bounded `firstname`/`lastname` candidate queries can support review, but are not confirmed contact matches and must not suppress staging.
7. Resolve property/role details through existing Dynamics mappings or leave them for PM review. Save a Pending suggestion, never a Dynamics contact.

## Constraints and validation

- Real mailbox metadata is authoritative for sender/recipient addresses; AI must not replace it.
- Treat email content as untrusted data. No email instruction can approve a record, change destinations, or cause a Dynamics write.
- AI Builder Extract standard entities is an AI entity-recognition model, not a general-purpose GPT prompt or autonomous Dataverse search agent.
- Runtime extraction passed with synthetic Alex Morgan. Output is under `responsev2.predictionOutput.result.entities`, with `type`, `value` and `score`. AI also misclassified an isolated surname, which reinforces mandatory review.
- Bound and validate real email input before replacing the fixed synthetic fixture.
- A failed Dynamics lookup must fail processing. AI failure must be visible and must not silently produce invented names.
- Keep review mandatory and preserve source evidence.

Reference: [AI Builder entity extraction](https://learn.microsoft.com/en-us/ai-builder/prebuilt-entity-extraction).
