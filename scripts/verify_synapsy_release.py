#!/usr/bin/env python3
"""Offline review of supplied SYNAPSY sources; never a production certification.

Inputs are read as data, never imported or executed. Exit 1: NO_GO findings;
exit 2: NOT_VERIFIED or invalid input. A hash match never authorizes deployment.
"""
import argparse
import ast
import hashlib
import json
import os
import re
import stat
import subprocess
from datetime import datetime, timezone
from pathlib import Path

FILES = ("synapsy_integrations_router.py", "main.py", "Dockerfile",
         "SynapsyProdConfig.kt", "run_synapsy_full_audit.js")
PROTECTED = ("Dockerfile", ".github/workflows/synapsy-infrastructure-proof.yml",
             "scripts/synapsy-infrastructure-proof.mjs",
             "apps/seva-android/online-diagnostics/src/main/kotlin/ai/seva/enterprise/config/SynapsyProdConfig.kt")
AREAS = ("infrastructure", "payment_delivery", "messaging", "account_ai",
         "external_sync", "cms_store", "mobile_accessibility", "http_route_audit")
SERIALIZATION = "python-json-sort-keys-default-v1"
MAX_BYTES = 2_000_000


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_text(path):
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_NONBLOCK", 0))
    try:
        metadata = os.fstat(descriptor)
        if not stat.S_ISREG(metadata.st_mode):
            raise ValueError(f"Input must be a regular file: {path.name}")
        if metadata.st_size > MAX_BYTES:
            raise ValueError(f"Input exceeds {MAX_BYTES} bytes: {path.name}")
        # Validate and read the same descriptor, including a bound if the file grows.
        with os.fdopen(descriptor, "rb", closefd=False) as source:
            data = source.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError(f"Input exceeds {MAX_BYTES} bytes: {path.name}")
    finally:
        os.close(descriptor)
    return data.decode("utf-8"), {"bytes": len(data), "sha256": digest(data)}


def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def check_integrity(path):
    if path is None:
        return {"status": "NOT_PROVIDED", "proves_operations": False}
    text, metadata = read_text(path)
    value = json.loads(text, object_pairs_hook=reject_duplicate_keys,
                       parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Non-finite JSON number")))
    if not isinstance(value, dict):
        raise ValueError("Receipts must be a JSON object")
    claimed = value.get("master_integrity_sha256")
    if not isinstance(claimed, str) or not re.fullmatch(r"[a-f0-9]{64}", claimed):
        return {"status": "INVALID_DIGEST", "file": metadata, "proves_operations": False}
    payload = {key: item for key, item in value.items() if key != "master_integrity_sha256"}
    computed = digest(json.dumps(payload, sort_keys=True, ensure_ascii=True,
                                 allow_nan=False).encode("utf-8"))
    declared = value.get("master_integrity_serialization")
    status = "MATCH" if computed == claimed else (
        "MISMATCH" if declared == SERIALIZATION else "UNKNOWN_CANONICALIZATION")
    return {"status": status, "file": metadata, "claimed_sha256": claimed,
            "candidate_sha256": computed, "candidate_serialization": SERIALIZATION,
            "serialization_detail": "UTF-8 json.dumps(payload without master_integrity_sha256, sort_keys=True, ensure_ascii=True, allow_nan=False); default separators",
            "serialization_declared": declared, "claimed_status": value.get("status"),
            "proves_operations": False, "authenticated_provenance": False}


def git_read(repository, *args):
    result = subprocess.run(["git", "-C", str(repository), *args],
                            capture_output=True, text=True, timeout=10, check=False)
    return result.stdout.strip() if result.returncode == 0 else None


def repository_root(path):
    if path is None:
        return None
    root = git_read(path, "rev-parse", "--show-toplevel") if path.is_dir() else None
    if not root:
        raise ValueError("--repository must identify a Git checkout")
    return Path(root).resolve()


def repository_snapshot(path):
    path = repository_root(path)
    if path is None:
        return {"status": "NOT_PROVIDED"}
    remote_head = git_read(path, "symbolic-ref", "--short", "refs/remotes/origin/HEAD")
    default = remote_head.removeprefix("origin/") if remote_head else None
    files = {}
    for relative in PROTECTED:
        file = path / relative
        files[relative] = read_text(file)[1] if file.is_file() else {"status": "MISSING"}
    return {"status": "OBSERVED_LOCAL_CHECKOUT", "commit": git_read(path, "rev-parse", "HEAD"),
            "default_branch": default, "default_branch_source": "local origin/HEAD; not a fresh remote query",
            "working_branch": git_read(path, "symbolic-ref", "--short", "HEAD"),
            "protected_files": files, "modified_by_preflight": False}


def review(args):
    source = args.source_dir.resolve()
    if not source.is_dir():
        raise ValueError("--source-dir must be an existing directory")
    findings, source_checks, texts, trees = [], {}, {}, {}

    def finding(code, file, detail, line=None):
        findings.append({"code": code, "file": file, "line": line, "detail": detail})

    for name in FILES:
        path = source / name
        if not path.is_file():
            source_checks[name] = {"status": "MISSING"}
            continue
        text, metadata = read_text(path)
        texts[name] = text
        source_checks[name] = {"status": "READ_AS_DATA", **metadata}
        if name.endswith(".py"):
            try:
                trees[name] = ast.parse(text, filename=name)
            except SyntaxError as error:
                finding("INVALID_PYTHON_SYNTAX", name, "Python parsing failed; file was not executed.", error.lineno)

    router_name = FILES[0]
    tree = trees.get(router_name)
    if tree:
        nodes = list(ast.walk(tree))
        calls = [node for node in nodes if isinstance(node, ast.Call)]
        for node in calls:
            if isinstance(node.func, ast.Attribute) and node.func.attr == "getenv" and len(node.args) > 1:
                if isinstance(node.args[1], ast.Constant) and node.args[1].value == "change-me":
                    finding("PUBLIC_WEBHOOK_SECRET_DEFAULT", router_name, "Environment lookup falls back to the public value change-me.", node.lineno)
        combined = "\n".join(ast.unparse(item) for item in trees.values())
        routes = [node for node in nodes if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and
                  any(isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) and d.func.attr == "post" for d in node.decorator_list)]
        if routes and not re.search(r"\b(?:Depends|Security)\s*\(|\bdependencies\s*=", combined):
            finding("AUTHORIZATION_NOT_SHOWN", router_name, "POST routes have no visible Depends/Security or dependencies declaration in these inputs; middleware or external authentication is not established.", routes[0].lineno)
        for node in nodes:
            if isinstance(node, ast.Return) and isinstance(node.value, ast.Dict):
                values = {k.value: v for k, v in zip(node.value.keys, node.value.values) if isinstance(k, ast.Constant)}
                if any(isinstance(values.get(key), ast.Constant) and values[key].value == value for key, value in (("new_status", "PAID"), ("delivery_status", "PROVISIONED"))):
                    finding("PAYMENT_SUCCESS_LITERAL", router_name, "Return constructs PAID/PROVISIONED literals; a persistent order transition and provisioning are not established by this return.", node.lineno)
                if isinstance(values.get("records_updated"), ast.Attribute) and values["records_updated"].attr == "records_synced":
                    finding("SYNC_COUNT_FROM_CALLER", router_name, "records_updated is copied from the request, not an independently observed write count.", node.lineno)
            if isinstance(node, ast.Attribute) and node.attr in ("remaining_quota_tokens", "consent_verified") and isinstance(node.value, ast.Name) and node.value.id == "req":
                code = "CLIENT_QUOTA" if node.attr == "remaining_quota_tokens" else "CLIENT_CONSENT_FLAG"
                if not any(item["code"] == code for item in findings):
                    finding(code, router_name, f"Decision reads caller-provided req.{node.attr}; server authority needs verification.", node.lineno)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "get" and len(node.args) > 1 and isinstance(node.args[0], ast.Constant) and node.args[0].value == "url":
                finding("CMS_FALLBACK_URL", router_name, "Remote URL uses a fallback instead of requiring a provider publication URL.", node.lineno)

    main_tree = trees.get("main.py")
    if main_tree:
        for node in ast.walk(main_tree):
            if isinstance(node, ast.Call):
                kwargs = {item.arg: item.value for item in node.keywords}
                origins = kwargs.get("allow_origins")
                credentials = kwargs.get("allow_credentials")
                if isinstance(origins, (ast.List, ast.Tuple)) and any(isinstance(item, ast.Constant) and item.value == "*" for item in origins.elts) and isinstance(credentials, ast.Constant) and credentials.value is True:
                    finding("WILDCARD_CORS_CREDENTIALS", "main.py", "CORS explicitly combines wildcard origins with credentials.", node.lineno)

    javascript = texts.get("run_synapsy_full_audit.js", "")
    if re.search(r"redirect\s*:\s*['\"]follow['\"]", javascript) and re.search(r"credentials\s*:\s*['\"]include['\"]", javascript):
        finding("AUDIT_FOLLOWS_CREDENTIALLED_REDIRECTS", "run_synapsy_full_audit.js", "Legacy scanner follows redirects and includes credentials; per-origin and login handling needs review.")
    repo = repository_snapshot(args.repository.resolve() if args.repository else None)
    deploy = {"status": "NOT_PROVIDED"}
    if args.deploy_script:
        script, metadata = read_text(args.deploy_script)
        deploy = {"status": "READ_AS_DATA", **metadata}
        for number, line in enumerate(script.splitlines(), 1):
            if line.lstrip().startswith("#"):
                continue
            if re.search(r"\bcp\s+-f\b", line) and "synapsy-infrastructure-proof.yml" in line:
                finding("WORKFLOW_OVERWRITE", args.deploy_script.name, "Forced copy can overwrite the corrected infrastructure workflow.", number)
            if "|| true" in line and re.search(r"\bpython(?:3(?:\.\d+)?)?\s+|\bgit\s+(?:add|commit)\b", line):
                finding("IGNORED_VERIFICATION_OR_COMMIT_ERROR", args.deploy_script.name, "The script continues after this verification or Git operation fails.", number)
            if re.search(r"\bgit\s+push\s+origin\s+main(?:\s|$)", line):
                finding("HARDCODED_MAIN_PUSH", args.deploy_script.name, f"Push targets main; locally observed default branch: {repo.get('default_branch') or 'UNKNOWN'}.", number)
    integrity = check_integrity(args.receipts)
    if integrity["status"] in ("INVALID_DIGEST", "MISMATCH"):
        finding("RECEIPT_INTEGRITY_FAILURE", args.receipts.name, integrity["status"])
    return {"schema_version": 1, "scope": "OFFLINE_SOURCE_REVIEW", "observed_at": datetime.now(timezone.utc).isoformat(),
            "status": "NO_GO" if findings else "NOT_VERIFIED", "source_checks": source_checks,
            "integrity_check": integrity, "repository": repo, "deployment_script": deploy,
            "findings": findings, "live_verification": {area: "NOT_VERIFIED" for area in AREAS},
            "limits": ["Targeted source heuristics, not an exhaustive security audit.",
                       "Inputs are never imported or executed; no provider or network requests are made.",
                       "A digest match proves internal consistency under the stated candidate serialization only.",
                       "Local tests, provider events, persisted records and physical device behavior require separate evidence.",
                       "Absence of findings is NOT_VERIFIED and never authorizes commit, push or deployment."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    for name in ("receipts", "deploy-script", "repository", "output"):
        parser.add_argument("--" + name, type=Path)
    args = parser.parse_args()
    try:
        args.repository = repository_root(args.repository)
        if args.output:
            target = args.output.resolve()
            inputs = {args.source_dir.resolve() / name for name in FILES}
            inputs.update(path.resolve() for path in (args.receipts, args.deploy_script) if path)
            if target in inputs or (args.repository and target.is_relative_to(args.repository.resolve())):
                raise ValueError("Output must not overwrite an input or write inside the inspected repository")
        result = review(args)
        rendered = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        if args.output:
            with args.output.open("x", encoding="utf-8") as output:
                output.write(rendered)
        print(rendered, end="")
        return 1 if result["status"] == "NO_GO" else 2
    except (OSError, ValueError, RecursionError, subprocess.SubprocessError) as error:
        print(json.dumps({"status": "INPUT_ERROR", "error": str(error), "live_verification": "NOT_VERIFIED"}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
