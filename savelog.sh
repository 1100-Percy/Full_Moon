#!/bin/bash
set -euo pipefail

STEP="${1:-phase0}"
LATEST=$(ls -t ~/.codex/sessions/*/rollout-*.jsonl 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "No Codex session log found."
  exit 1
fi

cp "$LATEST" "agent-logs/$(git config user.name 2>/dev/null || echo codex)-$STEP.jsonl"
git add -A
git commit -m "$STEP + agent log"
