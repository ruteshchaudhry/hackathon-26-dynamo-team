"""Load setup/test-emails.json into the existing sample scanner. No email is sent."""
import argparse
import copy
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bridge_setup', ROOT / 'setup/configure-flow-bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
WORKFLOW_ID = '7ea3665c-40bc-f111-aaae-000d3a8730d1'


def read_samples(path):
    samples = json.loads(path.read_text())
    if not isinstance(samples, list) or not 1 <= len(samples) <= 50:
        raise ValueError('Use an array of 1–50 sample emails.')
    identities = set()
    for sample in samples:
        required = ['id', 'sourceMailbox', 'from', 'senderName', 'receivedAt', 'subject', 'body']
        if not isinstance(sample, dict) or any(not isinstance(sample.get(key), str) or not sample[key].strip() for key in required):
            raise ValueError('Each sample needs its email metadata and text fields.')
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', sample['from']) or len(sample['from']) > 255:
            raise ValueError('A sample sender address is invalid.')
        if not isinstance(sample.get('to'), list) or not all(isinstance(x, str) for x in sample['to']):
            raise ValueError('Each sample needs a recipient array.')
        if len(sample['body']) > 10000 or not sample['subject'].startswith('[SAMPLE]'):
            raise ValueError('Keep sample bodies under 10,000 characters and subjects marked [SAMPLE].')
        identity = (sample['sourceMailbox'], sample['id'])
        if identity in identities:
            raise ValueError('Sample mailbox/message IDs must be unique.')
        identities.add(identity)
    return samples


def outcome(value, after=None):
    return {'type': 'AppendToArrayVariable', 'inputs': {'name': 'Email_results', 'value': {
        'messageId': "@outputs('Sample_email')?['id']", 'outcome': value,
    }}, 'runAfter': after or {}}


def transform(definition, samples):
    result = copy.deepcopy(definition)
    actions = result['actions']
    if 'For_each_email' in actions:
        # Re-running the helper only refreshes the committed test input.
        if actions['For_each_email'].get('foreach') != "@outputs('Test_emails')":
            raise ValueError('Unexpected batch structure; review before updating.')
        actions['Test_emails']['inputs'] = samples
        return result
    expected = {'Sample_email', 'List_rows', 'Condition', 'Extract_standard_entities', 'Get_items', 'Get_items_1', 'Condition_1'}
    if set(actions) != expected or actions['Sample_email']['type'] != 'Compose':
        raise ValueError('The scanner changed; review its action structure before updating.')
    condition = actions['Condition']
    if set(condition.get('actions', {})) != {'Terminate'} or condition.get('else', {}).get('actions'):
        raise ValueError('Unexpected match branch; no update applied.')
    if actions['Condition_1'].get('else', {}).get('actions'):
        raise ValueError('Unexpected duplicate branch; no update applied.')
    actions['Sample_email']['inputs'] = "@items('For_each_email')"
    condition['actions'] = {'Existing_contact': outcome('ExistingContact')}
    missing = {key: actions[key] for key in ['Extract_standard_entities', 'Get_items', 'Get_items_1', 'Condition_1']}
    missing['Extract_standard_entities']['runAfter'] = {}
    duplicate = missing['Condition_1']
    duplicate['actions']['Suggestion_created'] = outcome('Staged', {'Create_item': ['Succeeded']})
    duplicate['else'] = {'actions': {'Already_reviewed_or_pending': outcome('AlreadyQueuedOrApproved')}}
    condition['else'] = {'actions': missing}
    result['actions'] = {
        'Test_emails': {'type': 'Compose', 'inputs': samples, 'runAfter': {}},
        'Initialise_results': {'type': 'InitializeVariable', 'inputs': {'variables': [{'name': 'Email_results', 'type': 'array', 'value': []}]}, 'runAfter': {'Test_emails': ['Succeeded']}},
        'For_each_email': {
            'type': 'Foreach', 'foreach': "@outputs('Test_emails')",
            'runtimeConfiguration': {'concurrency': {'repetitions': 1}},
            'actions': {key: actions[key] for key in ['Sample_email', 'List_rows', 'Condition']},
            'runAfter': {'Initialise_results': ['Succeeded']},
        },
        'Test_summary': {'type': 'Compose', 'inputs': {
            'sampleCount': "@length(outputs('Test_emails'))", 'processedCount': "@length(variables('Email_results'))", 'results': "@variables('Email_results')",
        }, 'runAfter': {'For_each_email': ['Succeeded']}},
    }
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    samples = read_samples(ROOT / 'setup/test-emails.json')
    if not args.apply:
        print(f'Validated {len(samples)} samples. Use --apply to load them into the existing scanner.');return
    token = bridge.backend.token(bridge.CRM)
    path = f'/api/data/v9.2/workflows({WORKFLOW_ID})'
    row = bridge.call(bridge.CRM, token, path + '?$select=name,clientdata')
    if row['name'] != 'Customer Capture - Scan sample emails':
        raise ValueError('Unexpected scanner identity.')
    client = json.loads(row['clientdata'])
    client['properties']['definition'] = transform(client['properties']['definition'], samples)
    bridge.call(bridge.CRM, token, path, 'PATCH', {'clientdata': json.dumps(client)}, {'If-Match': row['@odata.etag']})
    bridge.call(bridge.CRM, token, path, 'PATCH', {'statecode': 1, 'statuscode': 2})
    print(f'Loaded {len(samples)} test emails. Scanner enabled; run it manually to test. No email sent or Dynamics business data changed.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, (ValueError, RuntimeError)) else 'Batch setup failed; private response details suppressed.')
        raise SystemExit(1)
