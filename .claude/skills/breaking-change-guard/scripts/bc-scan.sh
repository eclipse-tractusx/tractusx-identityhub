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

# Heuristic breaking-change scan of the current change set (committed + uncommitted) against a
# base. It flags what operators, wallet holders, issuers and connectors would notice, and which
# follow-ups (migration guide, CHANGELOG, helm-docs, OpenAPI specs, DEPENDENCIES, chart version,
# license headers, tests) are missing. It is a triage aid: every finding still needs judgement.
#
# Usage: bc-scan.sh [base-ref] [--strict]
#   base-ref   default: origin/main (compared from the merge base, including the working tree)
#   --strict   exit 1 if any BLOCKER or BREAKING finding exists
set -euo pipefail

BASE="origin/main"; STRICT=0
for a in "$@"; do case "$a" in --strict) STRICT=1 ;; -h|--help) sed -n '/^# Heuristic/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;; *) BASE="$a" ;; esac; done
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
MB=$(git merge-base "$BASE" HEAD) || { echo "bc-scan: cannot find merge base with $BASE" >&2; exit 2; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
MIG=extensions/store/sql/migrations/src/main/resources/org/eclipse/tractusx/store/postgresql

git diff --name-status "$MB" > "$TMP/status"
git ls-files --others --exclude-standard | sed 's/^/A\t/' >> "$TMP/status"
CHANGED=$(awk -F'\t' '{print $NF}' "$TMP/status")
[ -n "$CHANGED" ] || { echo "No changes against $BASE ($MB)."; exit 0; }

N_BLOCK=0; N_BREAK=0; N_HIGH=0; N_WARN=0
finding() {
  case "$1" in BLOCKER) N_BLOCK=$((N_BLOCK+1)) ;; BREAKING) N_BREAK=$((N_BREAK+1)) ;; HIGH) N_HIGH=$((N_HIGH+1)) ;; WARN) N_WARN=$((N_WARN+1)) ;; esac
  printf '%-8s %s\n' "$1" "$2"
}
changed_match() { echo "$CHANGED" | grep -E -- "$1" || true; }
removed_lines() { git diff -U0 "$MB" -- "$@" | grep -E '^-[^-]' | sed 's/^-//' || true; }
added_lines()   { { git diff -U0 "$MB" -- "$@" | grep -E '^\+[^+]' | sed 's/^+//'; for f in $(git ls-files --others --exclude-standard -- "$@"); do cat "$f"; done; } || true; }
yaml_paths() {
  awk '/^[[:space:]]*(#|$)/ {next}
       match($0, /^ *[A-Za-z0-9_.-]+:/) { ind = match($0, /[^ ]/) - 1; k = $0; sub(/^ */, "", k); sub(/:.*/, "", k)
         while (n > 0 && lvl[n] >= ind) n--; n++; lvl[n] = ind; key[n] = k
         p = key[1]; for (i = 2; i <= n; i++) p = p "." key[i]; print p }' | sort -u
}
openapi_ops() { # "METHOD /path" pairs of an OpenAPI YAML on stdin
  awk '/^paths:/ { inp = 1; next } inp && /^[^ ]/ { inp = 0 }
       inp && /^  [^ ].*:$/ { p = $0; sub(/^  /, "", p); sub(/:$/, "", p); gsub(/"/, "", p) }
       inp && /^    (get|put|post|delete|patch|head|options):/ { m = $1; sub(/:$/, "", m); print toupper(m) " " p }' | sort -u
}
vnum() { echo "$1" | sed -E 's/^V//; s/__.*//' | awk -F_ '{printf "%06d%06d%06d%06d\n", $1, $2, $3, $4}'; }
CODE=$(changed_match '\.(java|kts|toml|ya?ml|properties|sql|ts|tsx|json|tpl)$' | grep -vE '^(docs/|\.claude/|\.github/agents/)' || true)

echo "Breaking-change scan: $(git rev-parse --abbrev-ref HEAD) vs $BASE (merge base ${MB:0:9})"
echo "$(echo "$CHANGED" | wc -l | tr -d ' ') files changed"
echo
REL=$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' | grep -v -e '-' | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 || true); REL=${REL:+v$REL}

# 1. Flyway migrations: released ones are immutable; new ones must be strictly newer and unique per subsystem.
while IFS=$'\t' read -r st f rest; do
  f="${rest:-$f}"
  case "$f" in "$MIG"/*/V*__*.sql) ;; *) continue ;; esac
  case "$st" in
    M*|D*|R*)
      if [ -n "$REL" ] && git ls-tree -r --name-only "$REL" -- "$(dirname "$f")/" 2>/dev/null | grep -F -e "/$(basename "$f")" >/dev/null; then
        finding BLOCKER "Released Flyway migration modified/removed: $f (shipped in $REL; Flyway validates checksums, add a new V…__ file instead)"
      else
        finding WARN "Unreleased Flyway migration modified: $f (not in ${REL:-any release}; fine only if no deployed snapshot or RC ran it)"
      fi ;;
    A*) d=$(dirname "$f"); me=$(basename "$f"); mv=$(vnum "$me")
        existing=$(git ls-tree --name-only "$MB" "$d/" 2>/dev/null | xargs -n1 basename 2>/dev/null | grep -E '^V.*__.*\.sql$' || true)
        dup=$(for o in $existing; do [ "$(vnum "$o")" = "$mv" ] && echo "$o"; done || true)
        newest=$(for o in $existing; do echo "$(vnum "$o") $o"; done | sort | tail -1 | cut -d' ' -f2 || true)
        if [ -n "$dup" ]; then finding BLOCKER "Duplicate Flyway version in $(basename "$d"): $me vs $dup"
        elif [ -n "$newest" ] && [[ "$(vnum "$newest")" > "$mv" ]]; then finding BLOCKER "New migration $me is older than $newest in $(basename "$d") (out of order; Flyway refuses it)"; fi
        finding HIGH "New DB migration $f: run PostgresqlIntegrationTest and the sql E2E profile, check upgradeability-test, add a migration-guide entry" ;;
  esac
done < "$TMP/status"
if [ -n "$(changed_match "^$MIG/[^/]+/V")" ] && [ -z "$(changed_match '^extensions/store/sql/migrations/src/main/java/')" ]; then
  for s in $(changed_match "^$MIG/[^/]+/V" | awk -F/ '{print $(NF-1)}' | sort -u); do
    git grep -qE "NAME_SUBSYSTEM *= *\"$s\"" -- extensions/store/sql/migrations/src/main/java || finding BLOCKER "Migration folder '$s' has no *MigrationExtension (NAME_SUBSYSTEM = \"$s\") registered in META-INF/services: it will never run"
  done
fi

# 2. Settings removed or renamed (string literals that look like setting keys).
JAVA_MAIN=':(glob)**/src/main/**/*.java'
KEYRE='"(edc|tx|tractusx|web|org\.eclipse\.tractusx)\.[A-Za-z0-9.<>%_-]+"'
removed_lines "$JAVA_MAIN" | grep -oE "$KEYRE" | tr -d '"' | sort -u > "$TMP/k_rem" || true
added_lines "$JAVA_MAIN" | grep -oE "$KEYRE" | tr -d '"' | sort -u > "$TMP/k_add" || true
for k in $(comm -23 "$TMP/k_rem" "$TMP/k_add"); do
  git grep -qF -- "\"$k\"" -- "$JAVA_MAIN" || finding BREAKING "Setting key removed/renamed: $k (deprecate first, or add a migration-guide row old -> new)"
done
NEW_KEYS=$(comm -13 "$TMP/k_rem" "$TMP/k_add" | while read -r k; do git grep -qF -e "\"$k\"" "$MB" -- "$JAVA_MAIN" 2>/dev/null || echo "$k"; done || true)

# 3. Helm: values removed, ConfigMap keys no longer set, helm-docs, chart version.
for v in $(changed_match '^charts/[^/]+/values\.yaml$'); do
  git show "$MB:$v" 2>/dev/null | yaml_paths > "$TMP/hv_old" || : > "$TMP/hv_old"
  if [ -f "$v" ]; then yaml_paths < "$v" > "$TMP/hv_new"; else : > "$TMP/hv_new"; fi
  comm -23 "$TMP/hv_old" "$TMP/hv_new" | awk '{ if (r != "" && index($0, r ".") == 1) next; r = $0; print }' > "$TMP/hv_rem"
  while read -r p; do
    kids=$(grep -c -- "^$p\." "$TMP/hv_old" || true)
    finding BREAKING "Helm value removed/renamed in $v: $p$([ "$kids" -gt 0 ] && echo " (+$kids nested keys)") (operators' values files silently stop working)"
  done < "$TMP/hv_rem"
done
removed_lines 'charts/*/templates/*' | grep -oE '^ *[a-z][A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+: *\{\{' | sed -E 's/^ *//; s/: *\{\{$//' | sort -u > "$TMP/cm_rem" || true
for k in $(cat "$TMP/cm_rem"); do
  git grep -qE -- "^ *${k//./\\.}:" -- 'charts/*/templates/*' || finding BREAKING "Runtime setting no longer set by any chart ConfigMap: $k"
done
for c in $(changed_match '^charts/[^/]+/' | cut -d/ -f2 | sort -u); do
  [ -d "charts/$c" ] || continue
  nondoc=$(changed_match "^charts/$c/" | grep -vE '/README\.md$' || true)
  [ -n "$nondoc" ] || continue
  if [ -f "charts/$c/README.md.gotmpl" ] && [ -n "$(changed_match "^charts/$c/(values\.yaml|Chart\.yaml|README\.md\.gotmpl)$")" ] && [ -z "$(changed_match "^charts/$c/README\.md$")" ]; then
    finding WARN "charts/$c changed but README.md not regenerated (helm-docs)"
  fi
  if ! git diff "$MB" -- "charts/$c/Chart.yaml" | grep -qE '^\+version:'; then
    finding WARN "charts/$c changed but Chart.yaml version was not bumped (chart-release workflows publish by version)"
  fi
done

# 4. API surface: committed OpenAPI specs (generated from the EDC controllers) and Tractus-X @Path.
for f in $(changed_match '^docs/api/(identityhub|issuerservice)/[^/]+\.yaml$'); do
  git show "$MB:$f" 2>/dev/null | openapi_ops > "$TMP/o_old" || : > "$TMP/o_old"
  if [ -f "$f" ]; then openapi_ops < "$f" > "$TMP/o_new"; else : > "$TMP/o_new"; fi
  while read -r op; do finding BREAKING "API operation removed from $f: $op (clients and the Postman/Bruno collections break)"; done < <(comm -23 "$TMP/o_old" "$TMP/o_new")
  if [ ! -s "$TMP/o_old" ]; then finding WARN "New OpenAPI spec $f ($(wc -l < "$TMP/o_new" | tr -d ' ') operations): check the Postman/Bruno collections cover them"; continue; fi
  while read -r op; do finding WARN "API operation added in $f: $op (add it to the Postman/Bruno collections and the walkthrough if user-facing)"; done < <(comm -13 "$TMP/o_old" "$TMP/o_new")
done
removed_lines "$JAVA_MAIN" | grep -oE '@Path\("[^"]+"\)' | sort -u > "$TMP/p_rem" || true
added_lines "$JAVA_MAIN" | grep -oE '@Path\("[^"]+"\)' | sort -u > "$TMP/p_add" || true
for p in $(comm -23 "$TMP/p_rem" "$TMP/p_add"); do git grep -qF -- "$p" -- "$JAVA_MAIN" || finding BREAKING "Tractus-X API path removed: $p"; done
api_touch=$(changed_match '^(extensions/api/|extensions/identityhub/|openapi/|gradle/libs\.versions\.toml$)')
if [ -n "$api_touch" ] && [ -z "$(changed_match '^docs/api/(identityhub|issuerservice)/')" ]; then
  finding WARN "API-related code or the EDC version changed but docs/api/{identityhub,issuerservice} not regenerated: run ./gradlew :openapi:identityhub-spec:copyGeneratedSpecToDocs :openapi:issuerservice-spec:copyGeneratedSpecToDocs (CI OpenAPI-Specs-Up-To-Date fails otherwise)"
fi

# 5. Security-sensitive Tractus-X extensions (ownership enforcement, super-user seeding, initial participant, vault partitions).
for m in $(changed_match '^extensions/(identityhub/[^/]+|seed/super-user)/src/main/' | sed -E 's#/src/main/.*##' | sort -u); do
  finding HIGH "Security-sensitive module changed: $m (who may read/write which participant, keys, secrets). Run its ApiTest/ComponentTest and the E2E flow on both profiles"
done
if removed_lines "$JAVA_MAIN" | grep -qE 'storeSecret|resolveSecret|deleteSecret' || added_lines "$JAVA_MAIN" | grep -qE 'storeSecret|resolveSecret|deleteSecret'; then
  finding HIGH "Vault access changed (storeSecret/resolveSecret/deleteSecret): check the participant partition is passed (memory vault is partitioned; HashiCorp is not) and test on BOTH compose profiles"
fi

# 6. DCP presentation scope handling (which credentials connectors receive).
dcp=$(changed_match '^runtimes/identityhub(-memory)?/src/main/java/' )
if [ -n "$dcp" ] || grep -qF 'tx.identityhub.scope.aliases' <(added_lines "$JAVA_MAIN"; removed_lines "$JAVA_MAIN"); then
  finding HIGH "DCP scope mapping changed (TxScopeToCriterionTransformer / tx.identityhub.scope.aliases): connectors may get different credentials in /presentations/query. Verify with the Tractus-X EDC dcp tests or the E2E presentation folder"
fi
r1=$(changed_match '^runtimes/identityhub/src/main/java/'); r2=$(changed_match '^runtimes/identityhub-memory/src/main/java/')
if { [ -n "$r1" ] && [ -z "$r2" ]; } || { [ -z "$r1" ] && [ -n "$r2" ]; }; then
  finding WARN "Only one of runtimes/identityhub and runtimes/identityhub-memory changed: their IdentityHubExtension/TxScopeToCriterionTransformer copies are meant to be identical"
fi

# 7. Runtime composition (features shipped in the four images).
for f in $(changed_match '^runtimes/[^/]+/build\.gradle\.kts$'); do
  while read -r l; do [ -n "$l" ] && finding WARN "Removed from $(dirname "$f"): $l (feature disappears from the published image)"; done < <(removed_lines "$f" | grep -E '(project\(|libs\.)' | sed -E 's/^ +//' || true)
done

# 8. Upstream EDC version bump.
if removed_lines gradle/libs.versions.toml | grep -qE '^edc *='; then
  o=$(removed_lines gradle/libs.versions.toml | grep -E '^edc *=' | cut -d'"' -f2); n=$(added_lines gradle/libs.versions.toml | grep -E '^edc *=' | cut -d'"' -f2)
  finding HIGH "Upstream EDC/IdentityHub bumped $o -> $n: run .claude/skills/upstream-edc-bump/scripts/bump-impact.sh $o $n and follow the upstream-edc-bump skill; update 'Current EDC Version' in README.md"
  grep -q "Current EDC Version: $n" README.md 2>/dev/null || finding WARN "README.md still does not say 'Current EDC Version: $n'"
fi

# 9. Follow-ups.
echo
if [ $((N_BLOCK + N_BREAK + N_HIGH)) -gt 0 ] && [ -z "$(changed_match '^docs/admin/migration-guide\.md$')" ]; then
  finding WARN "Breaking/high-impact findings but docs/admin/migration-guide.md unchanged: add an entry under the upcoming release"
fi
if [ -n "$CODE" ] && [ -z "$(changed_match '^CHANGELOG\.md$')" ]; then
  finding WARN "Code/config changed but CHANGELOG.md [Unreleased] was not updated (Keep a Changelog: Added/Changed/Fixed/Removed/Security)"
fi
if git diff -U0 "$MB" -- gradle/libs.versions.toml '*build.gradle.kts' 2>/dev/null | grep -E '^\+' | grep -v 'project(' | grep -qE '(libs\.[a-z]|version|= *"[0-9])'; then
  [ -n "$(changed_match '^DEPENDENCIES$')" ] || finding HIGH "Dependency declarations changed but DEPENDENCIES not updated: dash-scan.yml fails on out-of-date entries. Run .claude/skills/dependencies-and-dash/scripts/dash-check.sh --write"
fi
if [ -n "$(changed_match '^ui/(package\.json|pnpm-lock\.yaml|package-lock\.json)$')" ] && [ -z "$(changed_match '^DEPENDENCIES_UI$')" ]; then
  finding HIGH "UI dependencies changed but DEPENDENCIES_UI not updated: run .claude/skills/dependencies-and-dash/scripts/dash-check.sh --ui"
fi
for k in $NEW_KEYS; do
  env=$(echo "$k" | tr '[:lower:]' '[:upper:]' | tr '.-' '__')
  git grep -qF -e "$k" -e "$env" -- '*.md' || finding WARN "New setting $k is not documented in any README or docs page"
done
# license headers on new text files (TRG 7-02)
for f in $(awk -F'\t' '$1 ~ /^A/ {print $NF}' "$TMP/status"); do
  case "$f" in *.java|*.kts|*.sh|*.sql|*.yaml|*.yml|*.properties|*.md|*.ts|*.tsx|*.tpl) ;; *) continue ;; esac
  case "$f" in */src/test/resources/*|*CHANGELOG.md|docs/api/identityhub/*|docs/api/issuerservice/*) continue ;; esac
  [ -f "$f" ] && ! grep -q 'SPDX-License-Identifier' "$f" && finding WARN "New file without SPDX license header: $f (TRG 7-02)"
done

echo
printf 'Summary: %d BLOCKER, %d BREAKING, %d HIGH, %d WARN\n' "$N_BLOCK" "$N_BREAK" "$N_HIGH" "$N_WARN"
[ "$STRICT" = 1 ] && [ $((N_BLOCK + N_BREAK)) -gt 0 ] && exit 1
exit 0
