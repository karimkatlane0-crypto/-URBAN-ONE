#!/usr/bin/env python3
"""Compatibility entry point for the SYNAPSY offline release review.

Exit 1: NO_GO findings. Exit 2: NOT_VERIFIED, invalid input, or unavailable
reviewer. This command cannot certify live integrations or authorize a deploy.
The existing reviewer reads supplied sources as data and never executes them.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REVIEWER = ROOT / "scripts" / "verify_synapsy_release.py"


def input_error(message):
    print(json.dumps({"status": "INPUT_ERROR", "error": message,
                      "live_verification": "NOT_VERIFIED"}))
    return 2


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=ROOT,
                        help="Directory containing the supplied files (default: this script's directory)")
    parser.add_argument("--receipts", type=Path,
                        help="Receipt JSON (default: synapsy_verification_receipts.json in source-dir, if present)")
    parser.add_argument("--deploy-script", type=Path, default=ROOT / "deploy_all.sh",
                        help="Shell script to inspect as data (default: the adjacent deploy_all.sh)")
    parser.add_argument("--repository", type=Path,
                        help="Git checkout to observe (default: this script's checkout, when present)")
    parser.add_argument("--output", type=Path,
                        help="New JSON report outside the inspected repository; existing files are never replaced")
    args = parser.parse_args()

    try:
        if not REVIEWER.is_file():
            return input_error("Required scripts/verify_synapsy_release.py is missing; use the complete checked-out revision.")
        source = args.source_dir.resolve()
        receipts = args.receipts
        if receipts is None:
            candidate = source / "synapsy_verification_receipts.json"
            # A dangling link or non-regular input must be rejected, not silently omitted.
            if candidate.exists() or candidate.is_symlink():
                receipts = candidate
        repository = args.repository
        if repository is None and (ROOT / ".git").exists():
            repository = ROOT

        command = [sys.executable, "-I", str(REVIEWER), "--source-dir", str(source)]
        for name, path in (("receipts", receipts), ("deploy-script", args.deploy_script),
                           ("repository", repository), ("output", args.output)):
            if path is not None:
                command.extend(["--" + name, str(path.resolve())])
        result = subprocess.run(command, check=False, timeout=60)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        return input_error(f"Offline review could not finish: {error}")

    if result.returncode in (1, 2):
        return result.returncode
    # The reviewer has no successful-live-release status. An unexpected zero,
    # crash, or signal must never unlock a command chained with &&.
    print("SYNAPSY: unexpected reviewer exit; live verification remains NOT_VERIFIED.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
