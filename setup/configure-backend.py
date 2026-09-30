"""Configure company sign-in and public server settings for the demo.

Run with --apply after reviewing setup/entra-access.md. Does not request Graph permissions, create credentials or change list permissions.
"""
import argparse
import copy
import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
APP_ID = '1da20b9d-2397-4a82-bfc8-9c3549f30cd3'
OBJECT_ID = '6c824978-4ae9-4565-935e-1a6e8aa2132e'
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
        print('Review setup/entra-access.md; --apply configures company API sign-in and public backend settings. No Graph consent or new credential is requested.')
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
                 'adminConsentDisplayName': 'Access Dynamine',
                 'adminConsentDescription': 'Review and approve demo contact suggestions.'}
        scopes.append(scope)
    api['oauth2PermissionScopes'] = scopes
    api['requestedAccessTokenVersion'] = 2
    preauth = copy.deepcopy(api.get('preAuthorizedApplications') or [])
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
    call(GRAPH, graph_token, f'/applications/{OBJECT_ID}', 'PATCH', {'api': api, 'identifierUris': uris})
    call(GRAPH, graph_token, f'/applications/{OBJECT_ID}', 'PATCH', {'api': {'preAuthorizedApplications': preauth}})
    print('Configured single-tenant API scope, v2 access tokens and SPA preauthorisation.')
    settings = call(ARM, arm_token, '/listAppSettings?api-version=2022-03-01', 'POST', {}).get('properties') or {}
    settings.update(json.loads((ROOT / 'setup/backend-settings.example.json').read_text()))
    call(ARM, arm_token, '/config/appsettings?api-version=2022-03-01', 'PUT', {'properties': settings})
    print('Company API sign-in and public settings configured; private callback and other existing settings retained.')

if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Setup failed. Check Azure CLI sign-in and app ownership; sensitive details suppressed.')
        raise SystemExit(1)
