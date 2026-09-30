# Scan flow build status — 30 September 2026

## Working now

[Open Customer Capture - Scan sample emails](https://make.powerautomate.com/environments/ae00c6cc-145f-41ea-bf30-1f0979a559c6/flows/035fa718-0bf4-e24b-2943-2a57d881c900?v3=true).

The manually triggered flow is saved in the existing Odevo Hackathon 2026 solution (`b13fb656-0cbc-f111-aaae-000d3a8730d1`). It uses a synthetic email, a live read-only Dynamics lookup, AI Builder name extraction and the configured SharePoint Lists. No mailbox connector is required yet. The deployed static app uses a protected backend API; it has no Scan now trigger yet. Refresh records will read the shared queue after backend application admin consent are complete.

Actual action order:

1. **Sample email** Compose contains [sample-email.json](sample-email.json) as an object.
2. **List rows** reads `contacts`, selects `contactid,firstname,lastname,emailaddress1`, limits results to two and filters `emailaddress1` by the trimmed, lower-case sender address. Single quotes are escaped for OData.
3. **Condition** checks `greater(length(body('List_rows')?['value']),0)`. Its true branch terminates successfully, before AI or SharePoint writes. A failed lookup stops processing rather than treating the contact as missing.
4. **Extract standard entities** uses English and the sender display name, subject and body.
5. **Get items** and **Get items 1** check ContactStaging and AddedContacts by normalised email OR source mailbox/message ID, each with top count one.
6. **Condition 1** permits creation only when both lists return zero items. Repeated scans currently still invoke AI before these checks.
7. **Filter array** keeps AI `PersonName` entities exactly matching the sender display name after trimming and case normalisation. Exactly two tokens become suggested first/last names; otherwise names remain blank. The PM must verify this heuristic.
8. **Create item** writes a Pending suggestion. CandidateKey is the normalised email. Source metadata and a short evidence excerpt are retained. Property, role and reviewer assignment remain blank pending integration and PM review.

## New site migration — 30 September 2026

Both **Get items** actions and **Create item** now use `https://randrltd.sharepoint.com/sites/CustomerCaptureDemo`. ContactStaging is `f3785741-154d-47ba-978c-74251305d71f`; AddedContacts is `356eae0e-5456-418c-ad49-1cc04f072ff6`. Changing the destination reset the Create item mappings; all original email, AI name, evidence, status and key expressions were restored and inspected in Code view before saving.

Run `08584108655006073950771836338CU27` succeeded on 30 September at 04:09 UTC and created a Pending Alex Morgan record in the new staging list. Repeat run `08584108653269769093276140486CU10` succeeded at 04:12 UTC; Filter array/Create item were skipped and the new staging list still contains one Alex Morgan record. No original-site record was moved or deleted. The sample input remains synthetic and the Dynamics lookup remains live and read-only.

## Verified results

- Live Dataverse contact lookup succeeded without modifying Dynamics business records.
- AI Builder extracted Alex Morgan from the synthetic email. It also misclassified an isolated surname, so extraction is advisory.
- The complete missing-contact path created one Pending Alex Morgan item in ContactStaging, with suggested FirstName Alex and LastName Morgan.
- Repeating the flow succeeded and skipped Filter array/Create item, avoiding a second suggestion.
- The incomplete static-output branch test was discarded. List rows shows **Static result off**, and the flow was saved with live lookup enabled.

The existing-contact exit branch is configured but has not yet been runtime-tested with a matching contact. Do not describe it as verified. No approval outcome or Dynamics contact was created during these tests.

## Next implementation work

1. **Flow owner:** test an existing-contact email; confirm termination occurs before AI and SharePoint writes. Test Dynamics/AI failures and concurrent duplicate handling. Add input validation, bounded real email text and controlled scan concurrency before replacing the fixed fixture.
2. **Dynamics owner:** confirm property/development/premises and role mappings. Name-based candidate queries are not implemented and must never establish identity by themselves.
3. **App owner:** activate the prepared server-side app-only Graph approval adapter after Entra/API/list setup; verify corrected AddedContacts values, durable save-before-delete and count. No approval flow is planned.
4. **App/integration owner:** configure Entra API sign-in and backend application grants; end users need no SharePoint permissions. The app uses Refresh records while the scan remains designer-run. The sample-data adapter is aligned to the contact-only rule.
5. **Mailbox owner:** replace the Compose source with a small approved inbox batch once access and connector policy are verified. Keep the demo source labelled synthetic until then.

See [Power Automate workstream](../power-automate-workstream.md), [SharePoint schema](sharepoint-schema.json) and [app integration workstream](../static-web-app-integration-workstream.md). No flow package export is included; the live designer is the current implementation.
