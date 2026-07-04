#!/bin/bash
set -euo pipefail

JOIN_CODE="${1:?Usage: ./submit-logs.sh <JOIN_CODE>}"

for f in agent-logs/*; do
  [ -f "$f" ] || continue
  jq -n --arg jc "$JOIN_CODE" --arg fn "$(basename "$f")" \
        --rawfile ct "$f" \
        '{join_code:$jc, filename:$fn, content:$ct}' \
  | curl -s -X POST https://crc4wet4.functions.insforge.app/submit-agent-logs \
         -H 'Content-Type: application/json' -d @-
  echo " <- $f"
done
