#!/usr/bin/env bash
# Package the skill payload into a release tarball.
# Payload = SKILL.md + references/ + scripts/ + LICENSE only —
# docs/, tests/, package.json, .github/, README, CONTRIBUTING, CHANGELOG, AGENTS.md
# are repository infrastructure and MUST NOT be included.
#
# Usage: bash scripts/package-skill.sh [version]
#   version defaults to the version in package.json.
# Output: dist/ai-agent-governance-skill.tar.gz (version-stable name, uploaded as a release asset)

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo '0.0.0')}"
OUT="dist/ai-agent-governance-skill.tar.gz"
STAGING="dist/skill-payload"

rm -rf "$STAGING"
mkdir -p "$STAGING"

# Copy the payload ONLY. Any new repo-infrastructure file added at the root
# must be excluded here (keep in sync with SKILL.md's Install Payload note).
cp SKILL.md "$STAGING/"
cp -R references "$STAGING/"
cp -R scripts "$STAGING/"
cp LICENSE "$STAGING/"

mkdir -p dist
tar -czf "$OUT" -C "$STAGING" .

rm -rf "$STAGING"

echo "created: $OUT (payload v${VERSION})"
echo "contents:"
tar -tzf "$OUT" | sort
