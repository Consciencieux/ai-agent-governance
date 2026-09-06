#!/usr/bin/env bash
# Package the skill payload into a release tarball.
# Payload = SKILL.md + references/ + scripts/ + LICENSE only —
# docs/, tests/, package.json, .github/, README, CONTRIBUTING, CHANGELOG, AGENTS.md
# are repository infrastructure and MUST NOT be included.
#
# Usage: bash repo-tools/package-skill.sh [version]
#   version defaults to the version in package.json.
# Output: dist/ai-agent-governance-skill.tar.gz (version-stable name, uploaded as a release asset)

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="${1:-$(node -p "require('./package.json').version" 2>/dev/null || echo '0.0.0')}"
OUT="dist/ai-agent-governance-skill.tar.gz"
STAGING="dist/skill-payload"

# macOS writes extended attributes (resource forks) alongside files, and bsdtar turns them
# into AppleDouble "._name" members. v0.13.1 shipped 34 of them — one per payload file —
# because the release was packaged on macOS: harmless to the governance boundary, but
# every user unpacked a directory littered with junk twins. COPYFILE_DISABLE stops tar
# from emitting them; --no-xattrs/--no-mac-metadata stop them at the source where the
# flag exists. The verification below is what actually guarantees the result, since which
# flags a given tar honours varies by platform.
export COPYFILE_DISABLE=1
export COPY_EXTENDED_ATTRIBUTES_DISABLE=1

rm -rf "$STAGING"
mkdir -p "$STAGING"

# Copy the payload ONLY. Any new repo-infrastructure file added at the root
# must be excluded here (keep in sync with SKILL.md's Install Payload note).
# -X drops extended attributes on macOS cp; it is silently accepted as a no-op elsewhere.
CP_FLAGS="-R"
if cp -X /dev/null "$STAGING/.cp-probe" 2>/dev/null; then CP_FLAGS="-RX"; fi
rm -f "$STAGING/.cp-probe"

cp SKILL.md "$STAGING/"
cp $CP_FLAGS references "$STAGING/"
cp $CP_FLAGS scripts "$STAGING/"
cp LICENSE "$STAGING/"

# Strip any attribute files that survived the copy, so the tar step cannot pick them up.
find "$STAGING" -name '._*' -delete 2>/dev/null || true
find "$STAGING" -name '.DS_Store' -delete 2>/dev/null || true

mkdir -p dist
TAR_FLAGS=""
if tar --no-xattrs -cf /dev/null -T /dev/null 2>/dev/null; then TAR_FLAGS="--no-xattrs"; fi
if tar --no-mac-metadata -cf /dev/null -T /dev/null 2>/dev/null; then TAR_FLAGS="$TAR_FLAGS --no-mac-metadata"; fi
# shellcheck disable=SC2086
tar $TAR_FLAGS -czf "$OUT" -C "$STAGING" .

rm -rf "$STAGING"

# Fail closed: the flags above are best-effort per platform, this check is not.
JUNK="$(tar -tzf "$OUT" | grep -E '(^|/)(\._|\.DS_Store)' || true)"
if [ -n "$JUNK" ]; then
  echo "ERROR: packaging emitted platform metadata files:" >&2
  echo "$JUNK" >&2
  rm -f "$OUT"
  exit 1
fi

echo "created: $OUT (payload v${VERSION})"
echo "contents:"
tar -tzf "$OUT" | sort

