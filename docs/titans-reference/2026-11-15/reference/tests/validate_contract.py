#!/usr/bin/env python3
"""Validate this reference contract structurally. No network or runtime API calls."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
import yaml

EXPECTED_PATHS = {
    '/v1/enterprise/overview', '/v1/nodes', '/v1/nodes/{id}/evidence',
    '/v1/agents', '/v1/ci/runs', '/v1/dependencies', '/v1/audit/events',
    '/v1/onboarding/status',
}
EXPECTED_SCOPES = {'enterprise:read', 'nodes:read', 'evidence:read',
                   'agents:read', 'ci:read', 'audit:read'}
ENDPOINT_SCOPES = {
    '/v1/enterprise/overview': 'enterprise:read',
    '/v1/nodes': 'nodes:read',
    '/v1/nodes/{id}/evidence': 'evidence:read',
    '/v1/agents': 'agents:read',
    '/v1/ci/runs': 'ci:read',
    '/v1/dependencies': 'enterprise:read',
    '/v1/audit/events': 'audit:read',
    '/v1/onboarding/status': 'enterprise:read',
}
HTTP_METHODS = {'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'}
PATH_FIELDS = {'summary', 'description', 'parameters', 'servers'}

class ContractError(ValueError):
    pass

class UniqueLoader(yaml.SafeLoader):
    pass

def unique_mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ContractError(f'Duplicate YAML key: {key}')
        result[key] = loader.construct_object(value_node, deep=deep)
    return result

UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)

def require(condition, message):
    if not condition:
        raise ContractError(message)

def parse_yaml(text):
    require(len(text) <= 1_000_000, 'Contract exceeds the local size limit')
    try:
        value = yaml.load(text, Loader=UniqueLoader)
    except (yaml.YAMLError, TypeError) as error:
        raise ContractError(f'Invalid YAML: {error}') from error
    require(isinstance(value, dict), 'OpenAPI root must be an object')
    return value

def validate_contract(spec, manifest):
    require(isinstance(manifest, dict), 'Manifest must be an object')
    require(spec.get('openapi') == '3.1.0', 'Expected OpenAPI 3.1.0')
    require('webhooks' not in spec, 'Webhooks are outside the reviewed reference subset')
    paths = spec.get('paths')
    require(isinstance(paths, dict) and set(paths) == EXPECTED_PATHS,
            'The contract must contain exactly the eight reviewed paths')
    require(manifest.get('status') == 'DESIGN_ONLY_NOT_INSTALLED',
            'Reference status must remain DESIGN_ONLY_NOT_INSTALLED')
    require(manifest.get('visibility') == 'private', 'Manifest visibility must remain private')
    require(manifest.get('material_type') == 'reference_only' and
            manifest.get('runtime_included') is False, 'No runtime installation may be claimed')
    safety = manifest.get('safety', {})
    for key in ['default_deny', 'tenant_scoped', 'business_operations_read_only']:
        require(safety.get(key) is True, f'Safety declaration must be true: {key}')
    for key in ['live_operations_enabled', 'external_messages_enabled',
                'payments_enabled', 'deployments_enabled']:
        require(safety.get(key) is False, f'Safety declaration must be false: {key}')
    require(manifest.get('auth') == {'type': 'oauth2', 'flow': 'authorizationCode',
                                     'pkce_required': True}, 'Unexpected manifest OAuth declaration')
    schemes = spec.get('components', {}).get('securitySchemes', {})
    require(set(schemes) == {'OAuth2'}, 'Only the reviewed OAuth2 scheme is allowed')
    scheme = schemes['OAuth2']
    require(scheme.get('type') == 'oauth2', 'Expected OAuth2 security scheme')
    flows = scheme.get('flows', {})
    require(set(flows) == {'authorizationCode'}, 'Only authorizationCode flow is reviewed')
    flow = flows['authorizationCode']
    require(flow.get('authorizationUrl') == 'https://example.invalid/oauth/authorize',
            'Authorization URL must remain the exact placeholder')
    require(flow.get('tokenUrl') == 'https://example.invalid/oauth/token',
            'Token URL must remain the exact placeholder')
    require(set(flow.get('scopes', {})) == EXPECTED_SCOPES, 'Unexpected declared OAuth scopes')
    permissions = manifest.get('permissions', [])
    require(isinstance(permissions, list) and len(permissions) == len(EXPECTED_SCOPES)
            and set(permissions) == EXPECTED_SCOPES, 'Permissions and OAuth scopes must match uniquely')

    def check_security(rules, context, expected_scope):
        require(isinstance(rules, list) and len(rules) == 1, f'Explicit OAuth required: {context}')
        rule = rules[0]
        require(isinstance(rule, dict) and set(rule) == {'OAuth2'}, f'Unexpected security: {context}')
        required_scopes = rule['OAuth2']
        require(isinstance(required_scopes, list) and bool(required_scopes)
                and len(required_scopes) == len(set(required_scopes))
                and set(required_scopes) <= EXPECTED_SCOPES,
                f'Empty, duplicate or undefined OAuth scopes: {context}')
        require(required_scopes == [expected_scope], f'Unexpected scope for {context}')

    check_security(spec.get('security'), 'root', 'enterprise:read')
    operation_ids = set()
    for path, item in paths.items():
        require(isinstance(item, dict), f'Invalid path item: {path}')
        require(set(item) <= HTTP_METHODS | PATH_FIELDS, f'Unsupported path field: {path}')
        require(set(item) & HTTP_METHODS == {'get'}, f'GET must be the only operation: {path}')
        operation = item['get']
        require(isinstance(operation, dict), f'Invalid operation: {path}')
        require('callbacks' not in operation, 'Callbacks are outside the reviewed reference subset')
        operation_id = operation.get('operationId')
        require(isinstance(operation_id, str) and
                re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,79}', operation_id),
                f'Missing or invalid operationId: {path}')
        require(operation_id not in operation_ids, f'Duplicate operationId: {operation_id}')
        operation_ids.add(operation_id)
        check_security(operation.get('security'), path, ENDPOINT_SCOPES[path])

    def inspect_urls(value, context='root'):
        if isinstance(value, dict):
            if 'servers' in value:
                servers = value['servers']
                require(isinstance(servers, list) and bool(servers), f'Invalid servers: {context}')
                for server in servers:
                    require(isinstance(server, dict) and
                            server.get('url') == 'https://example.invalid' and
                            not server.get('variables'),
                            f'Non-placeholder server URL: {context}')
            if '$ref' in value:
                require(isinstance(value['$ref'], str) and value['$ref'].startswith('#/'),
                        f'External reference not allowed: {context}')
            for key, child in value.items():
                inspect_urls(child, f'{context}.{key}')
        elif isinstance(value, list):
            for child in value:
                inspect_urls(child, context)

    require(bool(spec.get('servers')), 'An explicit placeholder server is required')
    inspect_urls(spec)
    return {'status': 'PASS', 'operations': len(operation_ids), 'scopes': len(EXPECTED_SCOPES),
            'scope': 'Structural reference checks only; runtime security NOT VERIFIED'}

def validate_package(root):
    root = Path(root).resolve()
    manifest = json.loads((root / 'reference/plugin/manifest.json').read_text())
    spec = parse_yaml((root / 'reference/openapi/titans-readonly.openapi.yaml').read_text())
    require(manifest.get('api') == {'type': 'openapi', 'spec': '../openapi/titans-readonly.openapi.yaml'},
            'Unexpected manifest API reference')
    return validate_contract(spec, manifest)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    try:
        print(json.dumps(validate_package(args.root), ensure_ascii=False))
    except (ContractError, OSError, json.JSONDecodeError, AttributeError, TypeError, KeyError) as error:
        print(json.dumps({'status': 'FAIL', 'error': str(error)}))
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
