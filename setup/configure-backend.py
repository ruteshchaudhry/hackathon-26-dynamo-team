"""Configure this demo's API identity and server settings. Never prints or saves secrets.

Run with --apply after reviewing setup/entra-access.md. Does not grant SharePoint
list access or change any existing user/group permission.
"""
import argparse
import datetime
import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
APP_ID = '1da20b9d-2397-4a82-bfc8-9c3549f30cd3'
OBJECT_ID = '6c824978-4ae9-4565-935e-1a6e8aa2132e'
SP_ID = '1787a630-f3e0-46d0-9dec-b76cfcb27a61'
GRAPH_ROLE = '23c5a9bd-d900-4ecf-be26-a0689755d9e5'
GRAPH_APP = '00000003-0000-0000-c000-000000000000'
SUB = '36a7b914-f275-4782-a9ea-bda7362ff589'
ARM = f'https://management.azure.com/subscriptions/{SUB}/resourceGroups/rg-portalapp-dev-uks/providers/Microsoft.Web/staticSites/swa-customer-capture-dev-20e0'
GRAPH = 'https://graph.microsoft.com/v1.0'

def token(resource):
    result = subprocess.run(['az', 'account', 'get-access-token', '--resource', resource, '--query', 'accessToken', '-o', 'tsv', '--only-show-errors'], capture_output=True, text=True)
    if result.returncode or not result.stdout.strip():
        raise RuntimeError('Azure CLI sign-in needs refreshing; no credential output is displayed.')
    return result.stdout.strip()

def call(base, access_token, path, method='GET', body=None):
    request = urllib.request.Request(base + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
            return json.loads(data) if data else {}
    except urllib.error.HTTPError as error:
        if method == 'PATCH' and path == f'/applications/{OBJECT_ID}':
            detail = json.loads(error.read()).get('error', {})
            raise RuntimeError('Public app manifest update failed: ' + detail.get('message', str(error.code))) from None
        raise RuntimeError(f'{method} setup request failed with HTTP {error.code}; response suppressed to protect credentials.') from None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.apply:
        print('Review setup/entra-access.md; --apply configures the API scope, selected-list application consent and a 7-day server credential. No SharePoint list grants are applied.')
        return
    graph_token = token('https://graph.microsoft.com')
    arm_token = token('https://management.azure.com/')
    app = call(GRAPH, graph_token, f'/applications/{OBJECT_ID}')
    if app['appId'] != APP_ID or app['signInAudience'] != 'AzureADMyOrg':
        raise RuntimeError('Unexpected app identity or tenant audience; refusing setup.')
    api = app.get('api') or {}
    scopes = api.get('oauth2PermissionScopes') or []
    scope = next((item for item in scopes if item['value'] == 'access_as_user'), None)
    if not scope:
        scope = {'id': str(uuid.uuid4()), 'value': 'access_as_user', 'type': 'Admin', 'isEnabled': True,
                 'adminConsentDisplayName': 'Access Customer Capture',
                 'adminConsentDescription': 'Review and approve demo contact suggestions.'}
        scopes.append(scope)
    api['oauth2PermissionScopes'] = scopes
    api['requestedAccessTokenVersion'] = 2
    preauth = api.get('preAuthorizedApplications') or []
    own = next((item for item in preauth if item['appId'] == APP_ID), None)
    if not own:
        own = {'appId': APP_ID, 'delegatedPermissionIds': []}
        preauth.append(own)
    if scope['id'] not in own['delegatedPermissionIds']:
        own['delegatedPermissionIds'].append(scope['id'])
    # New scopes must exist before Graph can validate preauthorisation references.
    api['preAuthorizedApplications'] = app.get('api', {}).get('preAuthorizedApplications') or []
    uris = app.get('identifierUris') or []
    if f'api://{APP_ID}' not in uris:
        uris.append(f'api://{APP_ID}')
    resources = app.get('requiredResourceAccess') or []
    graph_access = next((item for item in resources if item['resourceAppId'] == GRAPH_APP), None)
    if not graph_access:
        graph_access = {'resourceAppId': GRAPH_APP, 'resourceAccess': []}
        resources.append(graph_access)
    if not any(item['id'] == GRAPH_ROLE for item in graph_access['resourceAccess']):
        graph_access['resourceAccess'].append({'id': GRAPH_ROLE, 'type': 'Role'})
    call(GRAPH, graph_token, f'/applications/{OBJECT_ID}', 'PATCH', {'api': api, 'identifierUris': uris, 'requiredResourceAccess': resources})
    call(GRAPH, graph_token, f'/applications/{OBJECT_ID}', 'PATCH', {'api': {'preAuthorizedApplications': preauth}})
    print('Configured single-tenant API scope, v2 access tokens and SPA preauthorisation.')
    graph_sp = call(GRAPH, graph_token, f"/servicePrincipals?$filter=appId%20eq%20'{GRAPH_APP}'&$select=id")['value'][0]['id']
    assignments = call(GRAPH, graph_token, f'/servicePrincipals/{SP_ID}/appRoleAssignments')['value']
    consent_ready = any(row['resourceId'] == graph_sp and row['appRoleId'] == GRAPH_ROLE for row in assignments)
    if not consent_ready:
        try:
            call(GRAPH, graph_token, f'/servicePrincipals/{SP_ID}/appRoleAssignments', 'POST', {'principalId': SP_ID, 'resourceId': graph_sp, 'appRoleId': GRAPH_ROLE})
            consent_ready = True
        except RuntimeError as error:
            if 'HTTP 403' not in str(error):
                raise
            print('Application consent needs an Entra administrator (HTTP 403). Continuing independent server configuration.')
    if consent_ready:
        print('Selected-list application consent configured; actual list grants remain separate.')
    settings = call(ARM, arm_token, '/listAppSettings?api-version=2022-03-01', 'POST', {})
    properties = settings.get('properties') or {}
    # Keep existing settings and an existing credential. No destructive credential reset.
    properties.update(json.loads((ROOT / 'setup/backend-settings.example.json').read_text()))
    if not properties.get('CAPTURE_CLIENT_SECRET'):
        expiry = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
        credential = call(GRAPH, graph_token, f'/applications/{OBJECT_ID}/addPassword', 'POST', {'passwordCredential': {'displayName': 'Customer Capture demo backend', 'endDateTime': expiry}})
        properties['CAPTURE_CLIENT_SECRET'] = credential['secretText']
        try:
            call(ARM, arm_token, '/config/appsettings?api-version=2022-03-01', 'PUT', {'properties': properties})
        except Exception:
            call(GRAPH, graph_token, f'/applications/{OBJECT_ID}/removePassword', 'POST', {'keyId': credential['keyId']})
            raise
        print('Stored new backend credential in Azure server settings only; expires ' + expiry + '.')
    else:
        call(ARM, arm_token, '/config/appsettings?api-version=2022-03-01', 'PUT', {'properties': properties})
        print('Updated server identifiers; retained the existing backend credential.')
    print('API sign-in and server settings configured. No end-user SharePoint permission or list grant was changed.')
    if not consent_ready:
        print('Still pending: Entra admin consent for Graph application access, plus the two SharePoint list grants.')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid tracebacks/HTTP response bodies that could expose credentials.
        print(str(error) if isinstance(error, RuntimeError) else 'Setup failed; sensitive details suppressed.')
        raise SystemExit(1)
