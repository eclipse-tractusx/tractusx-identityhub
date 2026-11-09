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

# Inspect and create the Tractus-X Flyway migrations of IdentityHub and IssuerService
# (extensions/store/sql/migrations: one folder per store "subsystem", one history table per
# subsystem: flyway_schema_history_<subsystem>).
#
# Usage: migrations.sh <command> [args]
#   status                          every subsystem: runtime(s), count, latest version, released?, extension class
#   next <subsystem>                print the next version for a subsystem without creating anything
#   new <subsystem> "<Description>" [--version V0_0_4]
#                                   create the next migration file of a subsystem
#   compare <subsystem> [version]   upstream EDC schema of that store (pinned version) next to the
#                                   Tractus-X migrations, with the columns only one side has
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
MOD=extensions/store/sql/migrations
BASE=$MOD/src/main/resources/org/eclipse/tractusx/store/postgresql
SKILLS=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); SRC="$SKILLS/ih-upstream-sources/scripts/ih-src.sh"
die() { echo "migrations: $*" >&2; exit 1; }
# newest final release tag (v0.4.1, not v0.5.0-rc1 nor chart tags)
REL=$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' | grep -v -e '-' | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 || true)
REL=${REL:+v$REL}

# subsystem folder -> upstream store artifact that owns the schema
upstream_store() {
  case "$1" in
    attestationdefinitions) echo issuerservice-attestation-definition-store-sql ;;
    credentialdefinitions) echo issuerservice-credential-definition-store-sql ;;
    credentialrequest) echo "holder-credential-request-store-sql holder-credential-offer-store-sql" ;;
    credentials) echo identity-hub-credentials-store-sql ;;
    didresource) echo identity-hub-did-store-sql ;;
    holder) echo issuerservice-holder-store-sql ;;
    issuanceprocess) echo issuance-process-store-sql ;;
    jti) echo jti-validation-store-sql ;;
    keypair) echo identity-hub-keypair-store-sql ;;
    participantcontext) echo participantcontext-store-sql ;;
    participantcontextconfig) echo participantcontext-config-store-sql ;;
    stsclient) echo sts-client-store-sql ;;
    *) echo "" ;;
  esac
}
vkey() { echo "$1" | sed -E 's/^V//; s/__.*//' | awk -F_ '{printf "%06d%06d%06d%06d\n", $1, $2, $3, $4}'; }
subsystems() { git ls-files "$BASE/*/V*__*.sql" | xargs -n1 dirname | xargs -n1 basename | sort -u; }
latest_in() { for f in $(git ls-files "$BASE/$1/V*__*.sql" | xargs -n1 basename); do echo "$(vkey "$f") $f"; done | sort | tail -1 | cut -d' ' -f2; }
next_version() { # bump the patch part: V0_0_3 -> V0_0_4 (the house style so far)
  local l; l=$(latest_in "$1")
  [ -n "$l" ] || { echo "V0_0_1"; return; }
  echo "${l%%__*}" | sed 's/^V//' | awk -F_ '{ printf "V%d_%d_%d\n", $1, $2, $3 + 1 }'
}
released() { [ -n "$REL" ] && git ls-tree -r --name-only "$REL" -- "$BASE/$1/" 2>/dev/null | grep -F -e "/$2" >/dev/null; }
runtimes_of() { # which chart datasource ConfigMaps bind this subsystem
  local r=""
  git grep -qE "edc\.sql\.store\.$1\.datasource" -- 'charts/tractusx-identityhub/templates/*' 2>/dev/null && r="identityhub"
  git grep -qE "edc\.sql\.store\.$1\.datasource" -- 'charts/tractusx-issuerservice/templates/*' 2>/dev/null && r="${r:+$r,}issuerservice"
  echo "${r:-none}"
}
ext_class() { git grep -lE "NAME_SUBSYSTEM *= *\"$1\"" -- "$MOD/src/main/java" 2>/dev/null | xargs -n1 basename 2>/dev/null | sed 's/\.java$//' | tr '\n' ' '; }
check_sub() { [ -d "$BASE/$1" ] || die "no subsystem '$1' (known: $(subsystems | tr '\n' ' '))"; }
columns() { # resulting column names after CREATE TABLE / ADD / DROP / RENAME COLUMN statements on stdin
  tr 'A-Z' 'a-z' | sed -E 's/--.*//' | awk '
    /create table/ { t = 1; next }
    t && /^[[:space:]]*\)/ { t = 0 }
    t && match($0, /^[[:space:]]*[a-z_][a-z0-9_]*[[:space:]]+[a-z]/) { c = $0; sub(/^[[:space:]]*/, "", c); sub(/[[:space:]].*/, "", c); if (c !~ /^(primary|constraint|foreign|unique|check)$/) col[c] = 1 }
    /add column/ { c = $0; sub(/.*add column[[:space:]]+(if not exists[[:space:]]+)?/, "", c); sub(/[^a-z0-9_].*/, "", c); col[c] = 1 }
    /drop column/ { c = $0; sub(/.*drop column[[:space:]]+(if exists[[:space:]]+)?/, "", c); sub(/[^a-z0-9_].*/, "", c); delete col[c] }
    /rename column/ { c = $0; sub(/.*rename column[[:space:]]+/, "", c); split(c, w, /[[:space:]]+to[[:space:]]+/); a = w[1]; b = w[2]; sub(/[^a-z0-9_].*/, "", a); sub(/[^a-z0-9_].*/, "", b); delete col[a]; col[b] = 1 }
    END { for (c in col) print c }' | sort -u
}

cmd="${1:-}"; shift || true
case "$cmd" in
  status)
    printf 'Latest release tag: %s\n\n' "${REL:-none}"
    printf '%-26s %-27s %5s  %-48s %-16s %s\n' "SUBSYSTEM" "RUNTIME(S)" "COUNT" "LATEST" "IN ${REL:-release}?" "EXTENSION"
    for s in $(subsystems); do
      l=$(latest_in "$s"); n=$(git ls-files "$BASE/$s/V*__*.sql" | wc -l | tr -d ' ')
      r="no (unreleased)"; released "$s" "$l" && r="yes"
      dups=$(git ls-files "$BASE/$s/V*__*.sql" | xargs -n1 basename | sed -E 's/__.*//' | sort | uniq -d | tr '\n' ' ')
      printf '%-26s %-27s %5s  %-48s %-16s %s%s\n' "$s" "$(runtimes_of "$s")" "$n" "$l" "$r" "$(ext_class "$s")" "${dups:+  DUPLICATE VERSIONS: $dups}"
    done
    echo
    echo "Toggle per subsystem: org.eclipse.tractusx.edc.postgresql.migration.<subsystem>.enabled (default true)"
    echo "Schema:               org.eclipse.tractusx.edc.postgresql.migration.schema (default public)" ;;
  next)
    [ $# -ge 1 ] || die "usage: next <subsystem>"
    check_sub "$1"; echo "$(next_version "$1")  ($BASE/$1, latest: $(latest_in "$1"))" ;;
  new)
    [ $# -ge 2 ] || die 'usage: new <subsystem> "<Description>" [--version V0_0_4]'
    s="$1"; desc="$2"; shift 2; ver=""
    check_sub "$s"
    [ "${1:-}" = "--version" ] && ver="${2:-}"
    [ -n "$ver" ] || ver=$(next_version "$s")
    echo "$ver" | grep -E '^V[0-9]+_[0-9]+_[0-9]+$' >/dev/null || die "version must look like V0_0_4"
    lk=$(latest_in "$s")
    if [ -n "$lk" ] && [[ ! "$(vkey "$ver")" > "$(vkey "$lk")" ]]; then die "$ver is not newer than $lk"; fi
    name=$(echo "$desc" | sed -E 's/[^A-Za-z0-9]+/_/g; s/^_+|_+$//g' | awk -F_ '{for (i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1' OFS=_)
    f="$BASE/$s/${ver}__${name}.sql"
    [ ! -e "$f" ] || die "$f exists"
    cat > "$f" <<EOF
--
--  Copyright (c) $(date +%Y) Contributors to the Eclipse Foundation
--
--  See the NOTICE file(s) distributed with this work for additional
--  information regarding copyright ownership.
--
--  This program and the accompanying materials are made available under the
--  terms of the Apache License, Version 2.0 which is available at
--  https://www.apache.org/licenses/LICENSE-2.0.
--
--  Unless required by applicable law or agreed to in writing, software
--  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
--  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
--  License for the specific language governing permissions and limitations
--  under the License.
--
--  SPDX-License-Identifier: Apache-2.0
--

-- $desc
-- Keep statements idempotent so re-runs and partially migrated databases are safe, e.g.:
-- ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <column> JSON;
EOF
    echo "Created $f"
    cat <<EOF

Next steps:
  1. Write the DDL/DML (idempotent: IF [NOT] EXISTS, guarded UPDATEs). Compare with the upstream schema:
       .claude/skills/sql-migration/scripts/migrations.sh compare $s
  2. Run the migration tests (needs Docker):
       ./gradlew :extensions:store:sql:migrations:test -DincludeTags="PostgresqlIntegrationTest"
  3. Prove it end to end on the sql profile:
       .claude/skills/dcp-e2e-flow/scripts/dcp-e2e.sh run sql
  4. Add a "Database Migrations" entry to docs/admin/migration-guide.md when operators must act
     (data migration, manual steps, disabling via org.eclipse.tractusx.edc.postgresql.migration.$s.enabled).
EOF
    ;;
  compare)
    [ $# -ge 1 ] || die "usage: compare <subsystem> [edc-version]"
    s="$1"; v="${2:-$(bash "$SRC" version)}"; check_sub "$s"
    ups=$(upstream_store "$s")
    [ -n "$ups" ] || { echo "'$s' has no upstream store schema (Tractus-X specific)."; exit 0; }
    up=""; for a in $ups; do
      for sf in $(bash "$SRC" schemas "^$a/" "$v" 2>/dev/null || true); do
        echo "== upstream $sf (EDC $v)"; one=$(bash "$SRC" schema "^$sf\$" "$v"); echo "$one" | grep -vE '^\s*--' | grep -v '^\s*$'; up="$up
$one"; done
    done
    tx=$(for f in $(git ls-files "$BASE/$s/V*__*.sql" | sort); do cat "$f"; echo; done)
    echo; echo "== Tractus-X migrations in $BASE/$s"; git ls-files "$BASE/$s/V*__*.sql" | sed 's/^/   /'
    echo "$up" | columns > "${TMPDIR:-/tmp}/ih-mig-up.$$"; echo "$tx" | columns > "${TMPDIR:-/tmp}/ih-mig-tx.$$"
    echo; echo "== Columns upstream but never created by a Tractus-X migration (likely a missing migration):"
    comm -23 "${TMPDIR:-/tmp}/ih-mig-up.$$" "${TMPDIR:-/tmp}/ih-mig-tx.$$" | sed 's/^/   + /'
    echo "== Columns in Tractus-X migrations but not upstream (dropped/renamed upstream, or Tractus-X only):"
    comm -13 "${TMPDIR:-/tmp}/ih-mig-up.$$" "${TMPDIR:-/tmp}/ih-mig-tx.$$" | sed 's/^/   - /'
    rm -f "${TMPDIR:-/tmp}/ih-mig-up.$$" "${TMPDIR:-/tmp}/ih-mig-tx.$$"
    echo; echo "(Heuristic on column names; also compare types, indexes and primary keys by eye.)" ;;
  ""|-h|--help|help) sed -n '/^# Inspect and create/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//' ;;
  *) die "unknown command '$cmd' (try --help)" ;;
esac
