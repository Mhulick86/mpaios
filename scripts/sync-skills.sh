#!/usr/bin/env bash
# Compare upstream marketingskills catalog with our curated set.
# Does not overwrite local files. Prints a diff of names only.
set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-coreyhaines31/marketingskills}"
UPSTREAM_BRANCH="${UPSTREAM_BRANCH:-main}"
API="https://api.github.com/repos/${UPSTREAM_REPO}/contents/skills?ref=${UPSTREAM_BRANCH}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_DIR="${REPO_ROOT}/.claude/skills"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl required" >&2
  exit 1
fi

tmp_upstream="$(mktemp)"
tmp_local="$(mktemp)"
trap 'rm -f "$tmp_upstream" "$tmp_local"' EXIT

curl -sSfL "$API" \
  | grep -o '"name": *"[^"]*"' \
  | sed 's/"name": *"\([^"]*\)"/\1/' \
  | sort -u > "$tmp_upstream"

find "$LOCAL_DIR" -maxdepth 1 -mindepth 1 -type d -printf "%f\n" \
  | sort -u > "$tmp_local"

echo "== upstream only (candidates to vary + vendor) =="
comm -23 "$tmp_upstream" "$tmp_local" || true
echo
echo "== local only (mpaios-specific variations) =="
comm -13 "$tmp_upstream" "$tmp_local" || true
echo
echo "== shared =="
comm -12 "$tmp_upstream" "$tmp_local" || true
