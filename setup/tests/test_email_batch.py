import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'configure-test-email-batch.py'
spec = importlib.util.spec_from_file_location('batch', path)
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

class BatchTests(unittest.TestCase):
    def original(self):
        return {'actions': {
            'Sample_email': {'type': 'Compose', 'inputs': {'id': 'one'}, 'runAfter': {}},
            'List_rows': {'type': 'OpenApiConnection', 'runAfter': {'Sample_email': ['Succeeded']}},
            'Condition': {'type': 'If', 'expression': {'greater': ['matches', 0]}, 'actions': {'Terminate': {'type': 'Terminate'}}, 'else': {'actions': {}}, 'runAfter': {'List_rows': ['Succeeded']}},
            'Extract_standard_entities': {'type': 'OpenApiConnection', 'runAfter': {'Condition': ['Succeeded']}},
            'Get_items': {'type': 'OpenApiConnection', 'runAfter': {'Extract_standard_entities': ['Succeeded']}},
            'Get_items_1': {'type': 'OpenApiConnection', 'runAfter': {'Get_items': ['Succeeded']}},
            'Condition_1': {'type': 'If', 'actions': {'Create_item': {'type': 'OpenApiConnection'}}, 'else': {'actions': {}}, 'runAfter': {'Get_items_1': ['Succeeded']}},
        }}

    def test_existing_contact_skips_one_email_without_terminating_batch(self):
        original = self.original()
        result = batch.transform(original, [{'id': 'a'}, {'id': 'b'}])
        loop = result['actions']['For_each_email']
        self.assertEqual(loop['runtimeConfiguration']['concurrency']['repetitions'], 1)
        condition = loop['actions']['Condition']
        self.assertNotIn('Terminate', condition['actions'])
        self.assertEqual(condition['actions']['Existing_contact']['inputs']['value']['outcome'], 'ExistingContact')
        self.assertEqual(condition['else']['actions']['Extract_standard_entities']['runAfter'], {})
        self.assertIn('Create_item', condition['else']['actions']['Condition_1']['actions'])
        self.assertIn('Terminate', original['actions']['Condition']['actions'])

    def test_refreshing_fixture_preserves_current_batch_logic(self):
        result = batch.transform(self.original(), [{'id': 'a'}])
        result['actions']['For_each_email']['description'] = 'preserve team edits'
        refreshed = batch.transform(result, [{'id': 'b'}])
        self.assertEqual(refreshed['actions']['Test_emails']['inputs'], [{'id': 'b'}])
        self.assertEqual(refreshed['actions']['For_each_email'], result['actions']['For_each_email'])

    def test_unexpected_flow_edits_stop_before_update(self):
        original = self.original()
        original['actions']['Condition']['else']['actions']['Team_change'] = {'type': 'Compose'}
        with self.assertRaises(ValueError): batch.transform(original, [])

if __name__ == '__main__': unittest.main()
