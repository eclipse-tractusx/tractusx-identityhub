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

# Reproduce the CI license check locally (.github/workflows/dash-scan.yml): build the dependency
# list of the whole Gradle build exactly like CI, run Eclipse Dash on it, and compare the result
# with the committed DEPENDENCIES file. CI fails when DEPENDENCIES is out of date or a dependency is
# rejected, so a PR that changes dependencies must commit the regenerated file.
# With --ui it does the same for the UI (ui/package-lock.json -> DEPENDENCIES_UI).
#
# Usage: dash-check.sh [--ui] [--list-only] [--write] [--out <dir>] [--dash-version 1.1.0]
#   --ui          check the UI dependencies instead of the Gradle build
#   --list-only   only build the dependency list and diff its coordinates against the committed file
#   --write       copy the regenerated file over DEPENDENCIES (or DEPENDENCIES_UI) in the repository
#   --out         working directory for the outputs (default: a new temp dir, printed at the end)
set -euo pipefail

UI=0; LIST_ONLY=0; WRITE=0; OUT=""; DASH_VERSION="1.1.0"
while [ $# -gt 0 ]; do
  case "$1" in --ui) UI=1; shift ;; --list-only) LIST_ONLY=1; shift ;; --write) WRITE=1; shift ;;
    --out) OUT="$2"; shift 2 ;; --dash-version) DASH_VERSION="$2"; shift 2 ;;
    -h|--help) sed -n '/^# Reproduce the CI license check/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option $1" >&2; exit 1 ;; esac
done
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
OUT=${OUT:-$(mktemp -d "${TMPDIR:-/tmp}/ih-dash.XXXXXX")}; mkdir -p "$OUT"
DASH_JAR="${XDG_CACHE_HOME:-$HOME/.cache}/eclipse-dash/org.eclipse.dash.licenses-$DASH_VERSION.jar"
if [ "$UI" = 1 ]; then TARGET=DEPENDENCIES_UI; else TARGET=DEPENDENCIES; fi

# 1. Dependency list.
if [ "$UI" = 1 ]; then
  # The committed DEPENDENCIES_UI was produced from ui/package-lock.json (the pnpm lockfile resolves a
  # different tree), so prefer it; IH_DASH_UI_LOCK=pnpm forces ui/pnpm-lock.yaml. Dash reads both formats.
  if [ -f ui/package-lock.json ] && [ "${IH_DASH_UI_LOCK:-npm}" != pnpm ]; then
    INPUT="$ROOT/ui/package-lock.json"
    perl -0ne 'while (/"node_modules\/((?:\@[^\/"]+\/)?[^"\/]+)"\s*:\s*\{[^{}]*?"version"\s*:\s*"([^"]+)"/g) { print "$1:$2\n" }' ui/package-lock.json | sort -u > "$OUT/dependency-list"
  elif [ -f ui/pnpm-lock.yaml ]; then
    INPUT="$ROOT/ui/pnpm-lock.yaml"
    awk '/^packages:/ { p = 1; next } /^[a-z]/ { p = 0 } p && /^  [^ ]/ { k = $0; gsub(/^ +|:$|\x27/, "", k); i = index(substr(k, 2), "@") + 1; print substr(k, 1, i - 1) ":" substr(k, i + 1) }' ui/pnpm-lock.yaml | sort -u > "$OUT/dependency-list"
  else echo "no ui/pnpm-lock.yaml or ui/package-lock.json" >&2; exit 1; fi
  # committed: npm/npmjs/-/acorn/8.16.0 or npm/npmjs/@scope/name/1.0.0 -> name:version
  sed -nE 's#^npm/npmjs/-/([^/]+)/([^,]+),.*#\1:\2#p; s#^npm/npmjs/(@[^/]+)/([^/]+)/([^,]+),.*#\1/\2:\3#p' "$TARGET" | sort -u > "$OUT/committed-list"
else
  echo "Resolving all dependencies like CI (./gradlew allDependencies) ..." >&2
  ./gradlew -q allDependencies | perl -nle 'print $& while /(?<=\s)[\w.-]+:[\w.-]+:[^:\s\[\]]+/g' | sort -u > "$OUT/dependency-list"
  INPUT="$OUT/dependency-list"
  sed -nE 's#^maven/mavencentral/([^/]+)/([^/]+)/([^,]+),.*#\1:\2:\3#p' "$TARGET" | sort -u > "$OUT/committed-list"
fi
echo "$(wc -l < "$OUT/dependency-list" | tr -d ' ') distinct coordinates -> $OUT/dependency-list" >&2

# 2. Coordinates diff against the committed file.
comm -23 "$OUT/dependency-list" "$OUT/committed-list" > "$OUT/new"
comm -13 "$OUT/dependency-list" "$OUT/committed-list" > "$OUT/gone"
printf '\n## Missing from %s (new artifacts or versions): %s\n' "$TARGET" "$(wc -l < "$OUT/new" | tr -d ' ')"
sed 's/^/   + /' "$OUT/new" | head -60
printf '\n## In %s but no longer used: %s\n' "$TARGET" "$(wc -l < "$OUT/gone" | tr -d ' ')"
sed 's/^/   - /' "$OUT/gone" | head -40
printf '\n## Already restricted in the committed file (pending IP review): %s\n' "$(grep -c ', restricted,' "$TARGET" || true)"
grep ', restricted,' "$TARGET" | sed 's/^/   ! /' || true

# 3. Eclipse Dash (contacts the Eclipse Foundation and ClearlyDefined APIs).
if [ "$LIST_ONLY" = 0 ]; then
  command -v java >/dev/null || { echo "java is required to run Eclipse Dash" >&2; exit 1; }
  if [ ! -s "$DASH_JAR" ]; then
    mkdir -p "$(dirname "$DASH_JAR")"
    curl -fsSL -o "$DASH_JAR" "https://repo.eclipse.org/service/rest/v1/search/assets/download?repository=dash-maven2-releases&maven.groupId=org.eclipse.dash&maven.artifactId=org.eclipse.dash.licenses&maven.baseVersion=$DASH_VERSION&maven.extension=jar"
  fi
  echo; echo "Running Eclipse Dash $DASH_VERSION on $(basename "$INPUT") ..." >&2
  java -jar "$DASH_JAR" "$INPUT" -summary "$OUT/$TARGET" > "$OUT/dash.log" 2>&1 || true
  [ -s "$OUT/$TARGET" ] || { echo "Dash produced no summary; see $OUT/dash.log" >&2; tail -5 "$OUT/dash.log" >&2; exit 1; }
  printf '\n## Eclipse Dash result: %s approved, %s restricted, %s rejected\n' \
    "$(grep -c ', approved,' "$OUT/$TARGET" || true)" "$(grep -c ', restricted,' "$OUT/$TARGET" || true)" "$(grep -c ', rejected,' "$OUT/$TARGET" || true)"
  grep -E ', (restricted|rejected),' "$OUT/$TARGET" | sed 's/^/   ! /' || true
  three() { cut -d, -f1-3 "$1" | sort; }
  if diff -q <(sort "$TARGET") <(sort "$OUT/$TARGET") >/dev/null; then
    printf '\n%s is up to date.\n' "$TARGET"
  elif diff -q <(three "$TARGET") <(three "$OUT/$TARGET") >/dev/null; then
    printf '\n%s matches in artifacts, licenses and status; only the approval authority changed for %s entries\n' "$TARGET" \
      "$(diff <(sort "$TARGET") <(sort "$OUT/$TARGET") | grep -c '^>' || true)"
    printf '(e.g. clearlydefined -> an IP ticket #NNNNN). Refresh it with --write when you touch dependencies anyway.\n'
    diff <(sort "$TARGET") <(sort "$OUT/$TARGET") | grep -E '^[<>]' | head -10 | sed 's/^/   /' || true
  else
    printf '\n## %s is OUT OF DATE (CI dash-scan fails). Line diff (committed < > generated):\n' "$TARGET"
    diff <(sort "$TARGET") <(sort "$OUT/$TARGET") | grep -E '^[<>]' | head -60 | sed 's/^/   /' || true
    if [ "$WRITE" = 1 ]; then cp "$OUT/$TARGET" "$ROOT/$TARGET"; echo "   -> wrote $TARGET (review and commit it)"; else echo "   -> re-run with --write to update $TARGET"; fi
  fi
fi
echo; echo "Outputs in $OUT"
