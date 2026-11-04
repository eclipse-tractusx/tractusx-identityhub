#!/usr/bin/env bash
#################################################################################
#  Copyright (c) 2026 Catena-X Automotive Network e.V.
#  Copyright (c) 2026 Contributors to the Eclipse Foundation
#
#  See the NOTICE file(s) distributed with this work for additional
#  information regarding copyright ownership.
#
#  This program and the accompanying materials are made available under the
#  terms of the Apache License, Version 2.0 which is available at
#  https://www.apache.org/licenses/LICENSE-2.0.
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#  License for the specific language governing permissions and limitations
#  under the License.
#
#  AI Disclosure: This file was entirely AI-generated.
#  The AI-generated portions are made available under CC0-1.0 and not subject
#  to the project's license. The human contributor has reviewed and verified
#  that the code is correct.
#
#  SPDX-License-Identifier: Apache-2.0 AND CC0-1.0
#  Assisted-By: Claude Code (claude-opus-5-5)
#################################################################################

# Draft the next section of docs/admin/migration-guide.md from evidence: the breaking-change scan
# against the latest release tag, the upstream EDC version change, Helm values and ConfigMap keys
# removed per chart, new Flyway migrations, API operations removed/added in the committed OpenAPI
# specs, the CHANGELOG [Unreleased] BREAKING lines and the commits since that release. Prints a
# section in the house format ("## <prev> → Unreleased" with numbered "### n." topics), every
# candidate marked TODO for a human to keep, rewrite or drop.
#
# Usage: draft-migration-guide.sh [--from <release-tag>] [--branch <ref>] [--write]
#   --from    previous release (default: newest final release tag, e.g. v0.4.1)
#   --branch  development line to compare (default: HEAD)
#   --write   insert the draft above the newest section of docs/admin/migration-guide.md
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
SKILLS=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
GUIDE=docs/admin/migration-guide.md
MIG=extensions/store/sql/migrations/src/main/resources/org/eclipse/tractusx/store/postgresql
FROM=""; BRANCH="HEAD"; WRITE=0
while [ $# -gt 0 ]; do
  case "$1" in --from) FROM="$2"; shift 2 ;; --branch) BRANCH="$2"; shift 2 ;; --write) WRITE=1; shift ;;
    -h|--help) sed -n '/^# Draft the next section/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option $1" >&2; exit 1 ;; esac
done
[ -n "$FROM" ] || FROM=v$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' | grep -v -e '-' | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)
git rev-parse -q --verify "$FROM^{commit}" >/dev/null || { echo "unknown release tag $FROM" >&2; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
yaml_paths() {
  awk '/^[[:space:]]*(#|$)/ {next}
       match($0, /^ *[A-Za-z0-9_.-]+:/) { ind = match($0, /[^ ]/) - 1; k = $0; sub(/^ */, "", k); sub(/:.*/, "", k)
         while (n > 0 && lvl[n] >= ind) n--; n++; lvl[n] = ind; key[n] = k
         p = key[1]; for (i = 2; i <= n; i++) p = p "." key[i]; print p }' | sort -u
}
cm_keys() { for f in $(git ls-tree -r --name-only "$1" -- "charts/$2/templates/" 2>/dev/null); do git show "$1:$f"; done | { grep -oE '^ *[a-z][A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+: *("|\{\{)' || true; } | sed -E 's/^ *//; s/:.*//' | sort -u; }
ops() { for f in $(git ls-tree -r --name-only "$1" -- docs/api/identityhub docs/api/issuerservice 2>/dev/null); do
  git show "$1:$f" | awk -v s="$(basename "$(dirname "$f")")/$(basename "$f" .yaml)" '/^paths:/ { inp = 1; next } inp && /^[^ ]/ { inp = 0 }
    inp && /^  [^ ].*:$/ { p = $0; sub(/^  /, "", p); sub(/:$/, "", p); gsub(/"/, "", p) }
    inp && /^    (get|put|post|delete|patch):/ { m = $1; sub(/:$/, "", m); print toupper(m) " " p " (" s ")" }'; done | sort -u; }

# Evidence
if [ "$(git rev-parse "$BRANCH")" = "$(git rev-parse HEAD)" ]; then bash "$SKILLS/breaking-change-guard/scripts/bc-scan.sh" "$FROM" > "$TMP/scan" 2>&1 || true
else echo "(breaking-change scan skipped: check out $BRANCH to include it)" > "$TMP/scan"; fi
edc_old=$(git show "$FROM:gradle/libs.versions.toml" | grep -E '^edc *=' | cut -d'"' -f2)
edc_new=$(git show "$BRANCH:gradle/libs.versions.toml" | grep -E '^edc *=' | cut -d'"' -f2)
: > "$TMP/values"; : > "$TMP/cm"
for c in $(git ls-tree --name-only "$BRANCH" charts/ | xargs -n1 basename); do
  git show "$FROM:charts/$c/values.yaml" 2>/dev/null | yaml_paths > "$TMP/o" || : > "$TMP/o"
  git show "$BRANCH:charts/$c/values.yaml" 2>/dev/null | yaml_paths > "$TMP/n" || : > "$TMP/n"
  [ -s "$TMP/o" ] && comm -23 "$TMP/o" "$TMP/n" | awk '{ if (r != "" && index($0, r ".") == 1) next; r = $0; print }' | sed "s#\$# ($c)#" >> "$TMP/values"
  cm_keys "$FROM" "$c" > "$TMP/co"; cm_keys "$BRANCH" "$c" > "$TMP/cn"
  [ -s "$TMP/co" ] && comm -23 "$TMP/co" "$TMP/cn" | sed "s#\$# ($c)#" >> "$TMP/cm"
done
git ls-tree -r --name-only "$FROM" -- "$MIG" 2>/dev/null | grep -E '/V[^/]*\.sql$' | sort > "$TMP/m_old" || true
git ls-tree -r --name-only "$BRANCH" -- "$MIG" | grep -E '/V[^/]*\.sql$' | sort > "$TMP/m_new" || true
NEW_MIG=$(comm -13 "$TMP/m_old" "$TMP/m_new")
ops "$FROM" > "$TMP/op_old"; ops "$BRANCH" > "$TMP/op_new"
OPS_REM=$( [ -s "$TMP/op_old" ] && comm -23 "$TMP/op_old" "$TMP/op_new" || true )
CL_BREAK=$(awk '/^## \[Unreleased\]/ { u = 1; next } u && /^## \[/ { exit } u && /BREAKING/' CHANGELOG.md 2>/dev/null || true)
git log "$BRANCH" --not "$FROM" --no-merges --format='%s' | grep -viE '^(chore|ci|build|test|docs)(\(|:)|dependabot|^bump |^merge ' | sort -u > "$TMP/commits" || true
PREV=${FROM#v}

{
echo "## $PREV → Unreleased"
echo
echo "<!-- DRAFT from $FROM..$BRANCH by .claude/skills/migration-guide-and-adr/scripts/draft-migration-guide.sh."
echo "     One numbered ### topic per operator-visible change: what changed, why, and the exact action required."
echo "     Use old -> new tables for chart values and settings. Delete this comment and the EVIDENCE block. -->"
echo
n=0
if [ "$edc_old" != "$edc_new" ]; then n=$((n+1))
  echo "### $n. Upstream Eclipse EDC / IdentityHub \`$edc_old\` → \`$edc_new\`"; echo
  echo "TODO: operator-visible upstream changes (API version segments, renamed settings, new required configuration)."
  echo "Evidence: \`.claude/skills/upstream-edc-bump/scripts/bump-impact.sh $edc_old $edc_new\`, https://github.com/eclipse-edc/IdentityHub/releases/tag/v$edc_new"; echo
fi
if [ -s "$TMP/values" ]; then n=$((n+1))
  echo "### $n. Chart values — removed or renamed"; echo
  echo "| Removed value | New value | Charts |"; echo "|---|---|---|"
  sed -E 's#^(.*) \((.*)\)$#| `\1` | TODO | `\2` |#' "$TMP/values"; echo
  echo "**Action required** if your custom values reference them: TODO"; echo
fi
if [ -s "$TMP/cm" ]; then n=$((n+1))
  echo "### $n. Runtime settings no longer set by the charts"; echo
  echo "| Setting | Replacement | Charts |"; echo "|---|---|---|"
  sed -E 's#^(.*) \((.*)\)$#| `\1` | TODO | `\2` |#' "$TMP/cm"; echo
fi
if [ -n "$OPS_REM" ]; then n=$((n+1))
  echo "### $n. API — operations removed or moved"; echo
  echo "TODO: replacement for each, and what clients (connectors, UI, scripts, collections) must change:"; echo
  echo "$OPS_REM" | sed 's/^/- `/; s/ (/` (/'; echo
fi
if [ -n "$NEW_MIG" ]; then n=$((n+1))
  echo "### $n. Database migrations"; echo
  echo "Run automatically on startup (disable per subsystem with \`org.eclipse.tractusx.edc.postgresql.migration.<subsystem>.enabled=false\`):"; echo
  echo "$NEW_MIG" | sed -E 's#.*/([^/]+)/(V[^/]*)\.sql#- `\1`: `\2`#'; echo
  echo "TODO: data changes, duration on large tables, rollback notes."; echo
fi
[ "$n" -gt 0 ] || { echo "### 1. TODO first topic"; echo; echo "TODO"; echo; }
echo "<!-- EVIDENCE (delete before merging) -------------------------------------------"
if [ -n "$CL_BREAK" ]; then echo; echo "CHANGELOG [Unreleased] BREAKING entries:"; echo "$CL_BREAK" | cut -c1-220 | sed 's/^/  /'; fi
echo; echo "Breaking-change scan $FROM..$BRANCH:"; sed 's/^/  /' "$TMP/scan"
echo; echo "Commits since $FROM ($(wc -l < "$TMP/commits" | tr -d ' ')):"; sed 's/^/  - /' "$TMP/commits" | head -80
echo "-------------------------------------------------------------------------------- -->"
echo
} > "$TMP/section"

if [ "$WRITE" = 1 ]; then
  grep -qF "## $PREV → Unreleased" "$GUIDE" && { echo "$GUIDE already has a '## $PREV → Unreleased' section; merge the draft by hand:" >&2; cat "$TMP/section"; exit 0; }
  awk -v f="$TMP/section" 'BEGIN { while ((getline l < f) > 0) s = s l "\n" } !done && /^## / { printf "%s", s; done = 1 } { print }' "$GUIDE" > "$TMP/guide"
  cp "$TMP/guide" "$GUIDE"; echo "Inserted the draft into $GUIDE above the newest section."
else
  cat "$TMP/section"
fi
