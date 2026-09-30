"""Publish frontend/ and the managed api/ to the configured hackathon Static Web App.

Requires Azure CLI sign-in, Node.js and npm. No deployment token is saved.
"""
from pathlib import Path
import os
import subprocess
import sys

SUBSCRIPTION = "36a7b914-f275-4782-a9ea-bda7362ff589"
RESOURCE_GROUP = "rg-portalapp-dev-uks"
APP_NAME = "swa-customer-capture-dev-20e0"
ROOT = Path(__file__).resolve().parents[1]


def main():
    installed = subprocess.run(["npm", "ci", "--prefix", "api", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"], cwd=ROOT)
    if installed.returncode:
        return installed.returncode
    result = subprocess.run(
        ["az", "staticwebapp", "secrets", "list", "--subscription", SUBSCRIPTION,
         "--resource-group", RESOURCE_GROUP, "--name", APP_NAME,
         "--query", "properties.apiKey", "-o", "tsv", "--only-show-errors"],
        capture_output=True, text=True,
    )
    token = result.stdout.strip()
    if result.returncode or not token:
        print("Could not obtain the deployment credential. Check az login and access to the app.", file=sys.stderr)
        return 1
    env = dict(os.environ, SWA_CLI_DEPLOYMENT_TOKEN=token)
    print(f"Publishing frontend and API to {APP_NAME} (production slot)...", flush=True)
    deployed = subprocess.run(
        ["npm", "exec", "--yes", "--package=@azure/static-web-apps-cli@2.0.10", "--",
         "swa", "deploy", str(ROOT / "frontend"), "--app-name", APP_NAME,
         "--api-location", str(ROOT / "api"), "--api-language", "node", "--api-version", "22",
         "--env", "production", "--no-use-keychain"],
        cwd=ROOT, env=env, capture_output=True, text=True,
    )
    print((deployed.stdout + deployed.stderr).replace(token, "[REDACTED]"))
    return deployed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
