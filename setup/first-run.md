# First working demo: setup order

## What is ready

The repository includes a working local sample-data review app. It can edit, approve, search, rescan fixtures, and show added contacts. The hosted app still uses the earlier delegated build. The source now has an app-only backend; complete [Entra API and SharePoint setup](entra-access.md), then deploy frontend and API together. End users need no SharePoint permissions. For a local sample-data session only, change mode to demo locally; localhost is not an authorised live sign-in redirect.

Run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://localhost:8000 and choose **Open sample-data demo**. Use **Reset sample data** to restore the fictional examples. Run the store checks with:

```sh
npm ci --prefix api
npm test --prefix api
```

## 1. Sign in with the right accounts

| Resource | Configuration |
|---|---|
| Power Platform environment | `ae00c6cc-145f-41ea-bf30-1f0979a559c6` |
| Solutions page | https://make.powerapps.com/environments/ae00c6cc-145f-41ea-bf30-1f0979a559c6/solutions |
| SharePoint site | https://randrltd.sharepoint.com/sites/PRJ_Nabo/ |
| Test mailbox | `testpmdyno-mine@outlook.com` |

Use the organisational work identity for Power Platform, Dynamics, and SharePoint. Use the test mailbox's personal Microsoft account for its Outlook.com connection. These are separate connections. Enter passwords only in Microsoft's sign-in screens; do not put them in configuration files.

The test address uses the **Outlook.com** connector, whose read action is **Get emails (V2)**. An organisational Exchange mailbox would use **Office 365 Outlook** instead. Verify that the environment allows Outlook.com to be combined with SharePoint/Dataverse under its connector policies. If blocked, ask the environment owner for an approved organisational test mailbox; do not work around the policy.

## 2. SharePoint Lists: schema configured

The existing lists were reused and missing columns added on 29 September 2026:

- `ContactStaging`
- `AddedContacts`

Use the verified [schema inventory](sharepoint-schema.json) and [SharePoint workstream](../sharepoint-workstream.md). List IDs and the resolved Graph site ID are server settings; see [backend configuration](backend-settings.example.json). AddedContacts retains three legacy internal names: TargetID, DevelpmentId, and PremiseId. Map these explicitly. Populate Title with a concise contact/property label in create actions.

CandidateKey uniqueness is configured in both lists, and SourceStagingId uniqueness in AddedContacts. Verify actual duplicate rejection with synthetic flow inputs. Backend application permissions still need configuration/testing with the site owner; no user list grants are required. Do not place browser fixture IDs such as `demo-property-1` into live Dynamics lookup fields.

## 3. Manual scan flow: first path verified

The existing **Odevo Hackathon 2026** solution is available in **Pre Dev**. Its solution ID is `b13fb656-0cbc-f111-aaae-000d3a8730d1`. Use a manually triggered flow named **Customer Capture - Scan sample emails** while inbox access is unavailable:

1. Add a built-in Data Operation → Compose action containing [sample-email.json](sample-email.json). This is a simulated email source; no mailbox connection or external mock service is needed.
2. Process its sender/recipient metadata, stable sample ID, subject and body. Start with one message, then expand to five. The sample property reference/role are unverified text and must not be treated as resolved Dynamics IDs.
3. Query Dynamics using Dataverse List rows with the actual contact email field and limited selected columns. This is read-only; confirm the environment's Dynamics organisation URL and existing table mappings first.
4. Extract explicit property references and roles from the sample message; query the mapped property/relationship tables.
5. Check both SharePoint Lists for prior candidates/outcomes, then create the missing suggestion in ContactStaging.
6. Run again and verify that no duplicate entry appears.

The live exact-email lookup, AI extraction, Pending creation and repeat-scan duplicate check have passed. See [flow build status](flow-build-status.md). Property/role lookup and the existing-contact runtime branch test remain outstanding. AI runs only on the no-email-match path. Failed Dynamics queries must be reported as errors, not missing contacts.

After inbox access becomes available, replace Compose with Outlook.com Get emails (V2), select the demo folder, limit the batch to five, include already-read messages, and omit attachments. Map each message into the same input shape and use its actual source ID. Keep the real-inbox acceptance check open until tested.

## 4. AI-assisted extraction

Use **AI Builder → Extract standard entities**, the option selected by Rutesh. Run a prompt is not present in Pre Dev's action catalogue; no Azure OpenAI connection is currently required. Pass the synthetic sender display name, subject and body with language English. The synthetic extraction test passed and suggested Alex Morgan; PM verification remains required.

Entity extraction supplies name evidence; it does not query Dynamics or prove identity. Keep unclear first/last names blank for PM review. Advisory name matching may use bounded `firstname`/`lastname` reads after zero email matches; never automatically link on a name alone. See [AI guidance](email-extraction-prompt.md).

## 5. Activate and test backend SharePoint approval

Complete the API scope, application consent, credential and two list grants in [access setup](entra-access.md). Deploy the frontend and API together. Sign into the hosted app with a tenant account that has no direct SharePoint list access and load the staged synthetic contact.

Correct its details and choose Approve & add. Confirm one AddedContacts record with the corrected values, removal from ContactStaging, and an increased Approved contacts created count after refresh/reload. Force a failed save and a cleanup failure in a controlled test to prove retry behavior. No second flow is needed and no Dynamics records are written.

The app has Refresh records while ingestion remains a manual designer-run flow. The approved SharePoint list can become the input to a later Dynamics import, with a fresh duplicate check and verified mappings.

## Status to record during setup

- [ ] Both browser sign-ins completed and correct tenant/environment verified.
- [ ] Outlook.com, SharePoint, and Dataverse connections tested together.
- [x] SharePoint Lists and their column schema confirmed.
- [ ] Backend app grants and runtime duplicate constraints tested; app users require no list permissions.
- [x] Mock email input plus live Dynamics reads creates one suggestion; repeating the scan skips creation.
- [ ] Real inbox ingestion replaces the sample source and is tested when access is available.
- [x] AI Builder entity extraction ran successfully on the synthetic email.
- [ ] Approval saves to AddedContacts and cleans staging safely.
- [ ] Live app sign-in and API integration verified.

References: [Outlook.com connector](https://learn.microsoft.com/en-us/connectors/outlook/), [Dataverse List rows](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows), [Run a prompt in a flow](https://learn.microsoft.com/en-us/ai-builder/use-a-custom-prompt-in-flow).
