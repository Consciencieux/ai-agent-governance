#!/usr/bin/env bash
# Must-ship mechanical gate set (Phase 8 / PLAN-0044 / ADR-0024).
# Fail-closed. Does NOT run full Gen1 `npm run check`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== must-ship: JS syntax =="
find scripts repo-tools tests -type f -name '*.js' -print0 \
  | xargs -0 -n1 node --check

echo "== must-ship: security =="
node tests/run-tests.js --suite security

echo "== must-ship: generator =="
node tests/run-tests.js --suite generator

echo "== must-ship: payload =="
node tests/run-tests.js --suite payload

echo "== must-ship: oracle-inventory =="
node tests/run-tests.js --suite oracle-inventory

echo "== must-ship: routing =="
node tests/run-tests.js --suite routing

echo "== must-ship: OK =="
