# Technical reference — engineers only

The [team guides](../README.md) explain the demo in plain language. This page collects setup details in one place.

## Current route

Browser → Entra-protected API → private Power Automate callback → SharePoint lists through the owner's existing connection.

The browser requests only our API scope. Users need no SharePoint permissions. The active storage mode is `flow`; no Graph application credential or application admin consent is used at runtime. Existing unused grants/credentials were not revoked. The old Graph adapter remains compatibility code, not the deployed connection.

The callback is a secret: store it only as `CAPTURE_FLOW_URL` in Azure server settings. The flow's signed HTTP trigger can be invoked by anyone holding that URL. The browser never receives it. Do not put it in source, chat, screenshots or logs. The API validates company tokens before calling it. The flow uses an embedded owner connection and fixed list destinations.

## Resources

| Resource | Value |
|---|---|
| Hosted app / SPA redirect | https://kind-ground-0ee249903.5.azurestaticapps.net/ |
| Azure app | `swa-customer-capture-dev-20e0` |
| Resource group | `rg-portalapp-dev-uks` — shared; do not delete |
| Subscription | `36a7b914-f275-4782-a9ea-bda7362ff589` |
| Tenant | `9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f` |
| App/client ID | `1da20b9d-2397-4a82-bfc8-9c3549f30cd3` |
| API scope | `api://1da20b9d-2397-4a82-bfc8-9c3549f30cd3/access_as_user` |
| Power Platform environment | `ae00c6cc-145f-41ea-bf30-1f0979a559c6` |
| Solution | Odevo Hackathon 2026, `b13fb656-0cbc-f111-aaae-000d3a8730d1` |
| Dynamics development URL | https://rendallandrittner-predev.crm11.dynamics.com |
| Demo site | https://randrltd.sharepoint.com/sites/CustomerCaptureDemo/ |

Public site/list IDs are in [backend settings](backend-settings.example.json); actual column names and unique constraints are in [schema inventory](sharepoint-schema.json). AddedContacts retains legacy internal names `TargetID`, `DevelpmentId`, `PremiseId`; the API maps them explicitly.

- [Sample scan designer](https://make.powerautomate.com/environments/ae00c6cc-145f-41ea-bf30-1f0979a559c6/flows/035fa718-0bf4-e24b-2943-2a57d881c900?v3=true)
- [Contact-data designer](https://make.powerautomate.com/environments/ae00c6cc-145f-41ea-bf30-1f0979a559c6/flows/6e72cd1c-efae-8548-29e8-6c32ca0e7a4e?v3=true)

## Setup and deploy

Existing configuration is applied. For an intentional reconfiguration, use Azure CLI signed into the same tenant:

```sh
python3 setup/configure-backend.py --apply
python3 setup/configure-flow-bridge.py --apply --store-callback
npm ci --prefix api
npm test --prefix api
python3 setup/deploy-static-app.py
```

The first helper configures the existing app API scope, v2 tokens, same-client preauthorisation and public settings. It does not request Graph permissions or create secrets. The second updates only the named demo flow, activates it and stores its private callback in Azure, preserving other settings. The owner connection reference is `odevo_sharedsharepointonline_89ee5`. It must remain valid and licensed.

Flow source and public IDs are in [flows/](flows/). Dataverse workflow APIs handle solution-flow changes. Callback discovery uses Power Automate's management endpoint, an unsupported public contract; if it changes, use the designer and place the callback directly in Azure settings. Never weaken tenant connector policy to make it work.

The deployment helper publishes frontend and managed Node 22 API together to the existing Free Static Web App. Git push alone does not deploy. Do not apply infrastructure in Complete mode or modify other apps in the shared group.

## API and storage rules

- `GET /api/contacts`: pending and approved records.
- `POST /api/contacts/save`: `{expected:{id,eTag},fields}`.
- `POST /api/contacts/approve`: `{expected:{id,eTag}}`.
- Send the app token in `X-Capture-Authorization: Bearer …`; the hosting gateway rewrites the standard Authorization header.
- Validate signature, issuer, tenant, audience, expiry, scope and caller. Derive ApprovedBy from the verified user identity.
- Only email, names and property/relationship labels can be edited. Correcting labels clears stale Dynamics IDs.
- The flow adapter translates fixed operations to SharePoint REST and uses `odata=minimalmetadata` to preserve record versions. Exact eTags prevent overwriting another reviewer.
- CandidateKey is normalised email and unique in both lists. SourceStagingId is unique in AddedContacts. Confirm the approved record before deletion; recover lost responses and cleanup retries without another addition.
- A future site move requires updating server IDs, the flow's fixed site/list mapping, and the pagination site check in the adapter.

Scanning uses a fixed synthetic email, live `contacts` lookup on `emailaddress1`, AI Builder entity extraction, and duplicate checks against both lists. No Dynamics business-data writes. First/last-name search and property ID resolution are not implemented. The intended test mailbox is `testpmdyno-mine@outlook.com`; inbox ingestion is not connected. Use Outlook.com for that address only after access and environment connector policy are verified.

## Local development

For an offline sample-only UI, temporarily set `frontend/config.js` mode to `demo`, then run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory frontend
```

Open http://localhost:8000. Restore `mode: 'live'` before deployment. Local samples stay in that browser; localhost is not configured as a live sign-in redirect.

References: [solution flow APIs](https://learn.microsoft.com/en-us/power-automate/manage-flows-with-code), [HTTP trigger authentication](https://learn.microsoft.com/en-us/power-automate/oauth-authentication), [managed Static Web Apps APIs](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions).
