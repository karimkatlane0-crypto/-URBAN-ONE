"""Negative tests for the reference validator; no HTTP/API/cluster operations."""
import copy
import json
from pathlib import Path
import unittest
from validate_contract import ContractError, parse_yaml, validate_contract, validate_package

ROOT = Path(__file__).resolve().parents[2]
TEXT = (ROOT / 'reference/openapi/titans-readonly.openapi.yaml').read_text()
MANIFEST = json.loads((ROOT / 'reference/plugin/manifest.json').read_text())

class ContractValidationTests(unittest.TestCase):
    def setUp(self):
        self.spec = parse_yaml(TEXT)
        self.manifest = copy.deepcopy(MANIFEST)

    def rejects(self, pattern):
        with self.assertRaisesRegex(ContractError, pattern):
            validate_contract(self.spec, self.manifest)

    def test_reviewed_contract_passes(self):
        result = validate_package(ROOT)
        self.assertEqual(result['operations'], 8)
        self.assertEqual(result['scopes'], 6)

    def test_quoted_post_is_not_hidden_by_yaml_syntax(self):
        self.spec = parse_yaml(TEXT.replace('    get:', "    'post':", 1))
        self.rejects('GET must be the only operation')

    def test_non_v1_mutating_path_is_not_ignored(self):
        self.spec['paths']['/v2/agents/execute'] = {'post': {}}
        self.rejects('exactly the eight reviewed paths')

    def test_trace_method_rejected(self):
        self.spec['paths']['/v1/agents']['trace'] = {}
        self.rejects('GET must be the only operation')

    def test_additional_server_rejected(self):
        self.spec['servers'].append({'url': 'https://api.example.com'})
        self.rejects('Non-placeholder server URL')

    def test_operation_server_override_rejected(self):
        self.spec['paths']['/v1/agents']['get']['servers'] = [{'url': 'https://api.example.com'}]
        self.rejects('Non-placeholder server URL')

    def test_oauth_url_rejected(self):
        self.spec['components']['securitySchemes']['OAuth2']['flows']['authorizationCode']['tokenUrl'] = 'https://api.example.com/token'
        self.rejects('Token URL must remain the exact placeholder')

    def test_duplicate_operation_id_rejected(self):
        self.spec['paths']['/v1/agents']['get']['operationId'] = 'listNodes'
        self.rejects('Duplicate operationId')

    def test_missing_operation_id_rejected(self):
        del self.spec['paths']['/v1/agents']['get']['operationId']
        self.rejects('Missing or invalid operationId')

    def test_undefined_scope_rejected(self):
        self.spec['paths']['/v1/agents']['get']['security'] = [{'OAuth2': ['undefined:read']}]
        self.rejects('undefined OAuth scopes')

    def test_empty_scope_rejected(self):
        self.spec['paths']['/v1/agents']['get']['security'] = [{'OAuth2': []}]
        self.rejects('Empty, duplicate or undefined OAuth scopes')

    def test_anonymous_alternative_rejected(self):
        self.spec['paths']['/v1/agents']['get']['security'].append({})
        self.rejects('Explicit OAuth required')

    def test_permission_mismatch_rejected(self):
        self.manifest['permissions'].remove('audit:read')
        self.rejects('Permissions and OAuth scopes must match uniquely')

    def test_duplicate_permission_rejected(self):
        self.manifest['permissions'].append('audit:read')
        self.rejects('Permissions and OAuth scopes must match uniquely')

    def test_duplicate_yaml_key_rejected(self):
        with self.assertRaisesRegex(ContractError, 'Duplicate YAML key'):
            parse_yaml(TEXT + '\npaths: {}\n')

    def test_external_reference_rejected(self):
        self.spec['paths']['/v1/agents']['get']['responses']['200'] = {'$ref': 'https://api.example.com/schema'}
        self.rejects('External reference not allowed')

    def test_runtime_installation_claim_rejected(self):
        self.manifest['status'] = 'LIVE'
        self.rejects('DESIGN_ONLY_NOT_INSTALLED')

    def test_mutating_safety_declaration_rejected(self):
        self.manifest['safety']['deployments_enabled'] = True
        self.rejects('Safety declaration must be false')

    def test_webhook_post_outside_paths_rejected(self):
        self.spec['webhooks'] = {'externalEvent': {'post': {
            'operationId': 'receiveEvent', 'responses': {'200': {'description': 'OK'}}}}}
        self.rejects('Webhooks are outside the reviewed reference subset')

    def test_callback_post_inside_get_rejected(self):
        self.spec['paths']['/v1/agents']['get']['callbacks'] = {
            'onEvent': {'{$request.query.callbackUrl}': {'post': {
                'operationId': 'notifyEvent', 'responses': {'200': {'description': 'OK'}}}}}}
        self.rejects('Callbacks are outside the reviewed reference subset')

    def test_audit_endpoint_cannot_use_general_scope(self):
        self.spec['paths']['/v1/audit/events']['get']['security'] = [{'OAuth2': ['enterprise:read']}]
        self.rejects('Unexpected scope for /v1/audit/events')

if __name__ == '__main__':
    unittest.main(verbosity=2)
