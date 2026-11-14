#!/usr/bin/env bash
# Compatibility command: mandatory offline preflight; no live deploy adapter.
set -euo pipefail

script_path=${BASH_SOURCE[0]}
case "$script_path" in
  */*) script_dir=${script_path%/*} ;;
  *) script_dir=. ;;
esac
script_dir="$(CDPATH= cd -- "$script_dir" && pwd -P)"

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'SYNAPSY: python3 missing; verification NOT_VERIFIED, release blocked.' >&2
  exit 2
fi
if [[ ! -f "$script_dir/verify_all_integrations.py" ]]; then
  printf '%s\n' 'SYNAPSY: verify_all_integrations.py missing; release blocked.' >&2
  exit 2
fi

if [[ $# -eq 1 && ( $1 == --help || $1 == -h ) ]]; then
  exec python3 -I "$script_dir/verify_all_integrations.py" --help
fi

printf '%s\n' 'SYNAPSY: offline verification before release; no provider operations are started.' >&2
# A nonzero result stops here and is propagated unchanged by set -e.
python3 -I "$script_dir/verify_all_integrations.py" "$@"

# Even a future reviewer returning zero cannot turn an offline review into
# permission to deploy. A provider-specific release path still needs evidence.
printf '%s\n' 'SYNAPSY: live release adapter unavailable; release NOT_VERIFIED and blocked.' >&2
exit 2
