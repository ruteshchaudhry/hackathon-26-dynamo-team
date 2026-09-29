# First working demo: setup order

## What is ready

The repository includes a working local sample-data review app. It can edit, approve, search, rescan fixtures, and show added contacts. It uses browser storage and has no live SSO, Outlook, AI, Dynamics, or SharePoint connection yet.

Run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://localhost:8000 and choose **Open sample-data demo**. Use **Reset sample data** to restore the fictional examples. Run the store checks with:

```sh
node --test tests/demo-store.test.mjs
```

## 1. Sign in with the right accounts

| Resource | Configuration |
|---|---|
| Power Platform environment | `ae00c6cc-145f-41ea-bf30-1f0979a559c6` |
| Solutions page | https://make.powerapps.com/environments/ae00c6cc-145f-41ea-bf30-1f0979a559c6/solutions |
| SharePoint site | https://randrltd.sharepoint.com/sites/PRJ_Nabo/ |
| Test mailbox | `testpmdyno-mine@outlook.com` |

Use the R&R work identity for Power Platform, Dynamics, and SharePoint. Use the test mailbox's personal Microsoft account for its Outlook.com connection. These are separate connections. Enter passwords only in Microsoft's sign-in screens; do not put them in configuration files.

The test address uses the **Outlook.com** connector, whose read action is **Get emails (V2)**. An organisational Exchange mailbox would use **Office 365 Outlook** instead. Verify that the environment allows Outlook.com to be combined with SharePoint/Dataverse under its connector policies. If blocked, ask the environment owner for an approved organisational test mailbox; do not work around the policy.

## 2. Create the SharePoint Lists

First check Site contents for existing lists with the agreed names. Create missing lists only:

- `ContactStaging`
- `AddedContacts`

Use the column definitions in [SharePoint workstream](../sharepoint-workstream.md). Create column internal names without spaces where practical and record the actual names, types, choice values, site ID, and list IDs. Keep the default Title column optional, or populate it with a concise contact/property label in every create action.

Configure candidate/source uniqueness and approved-user access with the site owner. Verify access using a synthetic test record. Do not place browser fixture IDs such as `demo-property-1` into live Dynamics lookup fields.

## 3. Prove one manual scan flow

In the supplied environment, create or reuse a solution named **Customer Capture POC**. Create a manually triggered flow, **Customer Capture — Scan inbox**:

1. Outlook.com: Get emails (V2), select the demo folder, limit the batch to five, include already-read messages, and omit attachment content.
2. For each message, capture its real sender/recipient metadata and source identifier. Use synthetic email content only for the initial test.
3. Query Dynamics using Dataverse List rows with the actual contact email field and limited selected columns. This is read-only; confirm the environment's Dynamics organisation URL and existing table mappings first.
4. Extract explicit property references and roles from the sample message; query the mapped property/relationship tables.
5. Check both SharePoint Lists for prior candidates/outcomes, then create the missing suggestion in ContactStaging.
6. Run again and verify that no duplicate entry appears.

Do not add AI until this path works once. Failed Dynamics queries must be reported as errors, not missing contacts.

## 4. Add AI-assisted extraction

Check whether **AI Builder → Run a prompt** is available and whether the environment has the required capacity. If available, insert it before property/relationship resolution. Use [email-extraction-prompt.md](email-extraction-prompt.md) as the starting prompt, then configure and validate structured JSON output.

The model suggests names, property references, roles, and evidence. Actual API queries establish what exists in Dynamics. Resolve suggested role labels and property references to allowed existing IDs; leave ambiguous matches for review. Keep deterministic sample extraction as a labelled fallback if AI is not available.

## 5. Prove approval storage

Build the approval action from [Power Automate workstream](../power-automate-workstream.md). Recheck Dynamics and AddedContacts, save a durable simulated result, then remove the staging record. Test failed saves and cleanup retries. Never use a Dynamics create/update/delete action.

## 6. Connect the static UI

Configure the single-tenant Entra SPA registration, approved users, localhost redirect URI, delegated SharePoint/Graph reads, and authenticated flow actions. Required non-secret configuration placeholders are in [config.js](../frontend/config.js).

Rutesh then replaces the demo adapter with live reads/actions and adds MSAL sign-in. Changing `mode` to `live` alone does not enable integration; the app intentionally refuses to enter an unimplemented live mode. Verify token audiences and browser CORS before finalising the action endpoint contract.

## Status to record during setup

- [ ] Both browser sign-ins completed and correct tenant/environment verified.
- [ ] Outlook.com, SharePoint, and Dataverse connections tested together.
- [ ] SharePoint Lists and their schema confirmed.
- [ ] One real scan creates one suggestion without duplicates.
- [ ] AI availability/capacity checked and prompt tested, if available.
- [ ] Approval saves to AddedContacts and cleans staging safely.
- [ ] Live app sign-in and API integration verified.

References: [Outlook.com connector](https://learn.microsoft.com/en-us/connectors/outlook/), [Dataverse List rows](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows), [Run a prompt in a flow](https://learn.microsoft.com/en-us/ai-builder/use-a-custom-prompt-in-flow).
