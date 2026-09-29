# Customer Capture: Entra and SharePoint access

## Applied on 29 September 2026

- Single-tenant Customer Capture SPA registration created; no client secret.
- Hosted redirect only: https://kind-ground-0ee249903.5.azurestaticapps.net/ . Localhost was removed at the user's request.
- Organisational users may sign in; enterprise-app assignment is not required. Each user still needs SharePoint access to the demo lists. The initial Rutesh assignment is retained but does not restrict sign-in.
- Delegated Graph consent granted for `Lists.SelectedOperations.Selected` only.
- Live frontend configuration deployed. Hosted Microsoft sign-in succeeded as the pilot account.
- **List grants are still pending.** Hosted list reads correctly report Access denied until those grants are applied. No live approval or staging deletion has been tested yet.

| Identifier | Value |
|---|---|
| Tenant | 9ef5d8a8-4dc3-418c-b183-03d3c2f44b3f |
| Application/client ID | 1da20b9d-2397-4a82-bfc8-9c3549f30cd3 |
| Application object ID | 6c824978-4ae9-4565-935e-1a6e8aa2132e |
| Enterprise application object ID | 1787a630-f3e0-46d0-9dec-b76cfcb27a61 |
| Scope | Lists.SelectedOperations.Selected |
| ContactStaging list ID | d2285f11-09dc-462b-b692-e3111a40c23f |
| AddedContacts list ID | 85fc11a7-c916-4af3-b25e-1b7346aba98a |

## Remaining setup: two list grants

The current Azure CLI Graph session can manage Entra applications but lacks SharePoint management scopes. Both grant calls returned 403 Access denied. A requested CLI sign-in with Sites.ReadWrite.All was rejected by Microsoft with AADSTS65002 (the Microsoft-owned CLI application is not preauthorised for this scope). It did not grant the requested scope.

Use an authorised Microsoft Graph setup client, such as Graph Explorer, with delegated `Sites.ReadWrite.All` and an account allowed to manage permissions on these lists. This is the setup tool's permission, not Customer Capture's. The user completed Graph Explorer sign-in and personally consented to Sites.ReadWrite.All (Principal: this user only). Its permission panel also showed pre-existing organisation consent for Sites.FullControl.All and Sites.Manage.All. Both list grant requests still returned 403 Access denied after the new consent. No Customer Capture list grant has been confirmed. A SharePoint site owner/administrator must apply the requests below or investigate the account’s effective permission and tenant restrictions. Do not broaden Customer Capture to site-wide permissions.

Run these two **POST** requests separately using Microsoft Graph v1.0:

```text
https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,894b0995-6a6a-4cf4-bad4-8019c7e75632,04153bf3-0839-4c40-b6ef-486829aa6e4b/lists/d2285f11-09dc-462b-b692-e3111a40c23f/permissions

https://graph.microsoft.com/v1.0/sites/randrltd.sharepoint.com,894b0995-6a6a-4cf4-bad4-8019c7e75632,04153bf3-0839-4c40-b6ef-486829aa6e4b/lists/85fc11a7-c916-4af3-b25e-1b7346aba98a/permissions
```

Use the same request body for both (also saved as [sharepoint-app-grant.json](sharepoint-app-grant.json)):

```json
{
  "grantedToV2": {
    "application": {
      "id": "1da20b9d-2397-4a82-bfc8-9c3549f30cd3",
      "displayName": "Customer Capture"
    }
  },
  "roles": ["write"]
}
```

The most recent failed batch was at 2026-09-29 21:17:01 UTC, request ID `0d228fb0-4c80-4d7b-9160-f75b5753029e`; both inner responses were 403. An outer batch HTTP 200 is not grant success. The request is also available as [a two-request batch](sharepoint-app-grants-batch.json), submitted with POST to `https://graph.microsoft.com/v1.0/$batch`.

Before repeating a request, GET its permissions collection and check whether this app already has a write grant. After creation, GET again to confirm the grant and preserve the existing groups/users. Selected-list grants break inheritance on those lists. Pre-grant inspection found five existing user/group entries per list; no entries have been changed by the failed grant calls.

After both grants succeed, refresh the hosted app, verify the staged synthetic contact appears, correct it, approve it, then confirm one AddedContacts result and successful staging cleanup. Check the approved-contact count after reload. Dynamics remains unchanged.

## Runtime and later handoff

The app uses MSAL 5.23.0, authorization code + PKCE, a tenant-specific authority and the hosted root redirect. Tokens use sessionStorage; SharePoint records stay in memory. No application-only, mailbox or Dynamics permission is granted to this SPA.

AddedContacts is the durable approved source for a later Dynamics import. That integration must recheck exact email, validate mandatory fields and real target/role IDs, and persist import outcomes and retries. It is not enabled by this demo.

References: [selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview), [list permission grant API](https://learn.microsoft.com/en-us/graph/api/list-post-permissions?view=graph-rest-1.0).
