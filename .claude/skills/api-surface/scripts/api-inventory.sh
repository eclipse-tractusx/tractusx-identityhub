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

# Inventory of the HTTP APIs that IdentityHub and IssuerService serve, built from the committed
# OpenAPI specs (docs/api/<service>/<context>.yaml, generated from the EDC controllers and checked
# for drift in CI), the runtime defaults, the Docker Compose port mappings and the Helm values.
#
# Usage: api-inventory.sh <command> [args]
#   contexts                  every web context per service: container port/path, compose host URL,
#                             Helm value, spec file and security scheme
#   list [regex]              every operation: METHOD path  service/context  compose URL
#   coverage [regex]          which operations the E2E Postman collection, the reference Postman
#                             collection and the Bruno collection exercise (gaps first)
#   drift                     regenerate the specs like CI and show what changed under docs/api
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
die() { echo "api-inventory: $*" >&2; exit 1; }
SERVICES="identityhub issuerservice"
E2E=docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json
REF="docs/api/postman/Eclipse Tractus-X Identity Hub.json"
BRUNO="docs/api/bruno"

prop() { grep -E "^$2=" "$1" 2>/dev/null | tail -1 | cut -d= -f2-; } # <file> <key>
host_port() { # <compose service> <container port> -> host port from docker-compose.yaml
  awk -v svc="  $1:" -v cp="$2" '
    $0 == svc { in_svc = 1; next }
    in_svc && /^  [a-z]/ { in_svc = 0 }
    in_svc && match($0, /"[0-9]+:[0-9]+"/) { split(substr($0, RSTART + 1, RLENGTH - 2), a, ":"); if (a[2] == cp) { print a[1]; exit } }' deployment/docker/docker-compose.yaml
}
yaml_get() { # <file> <dotted.path> -> scalar value
  awk -v target="$2" '
    /^[[:space:]]*(#|$)/ { next }
    match($0, /^ *[A-Za-z0-9_.-]+:/) {
      ind = match($0, /[^ ]/) - 1; k = $0; sub(/^ */, "", k); sub(/:.*/, "", k)
      while (n > 0 && lvl[n] >= ind) n--; n++; lvl[n] = ind; key[n] = k
      p = key[1]; for (i = 2; i <= n; i++) p = p "." key[i]
      if (p == target) { v = $0; sub(/^[^:]*: */, "", v); sub(/ +#.*/, "", v); gsub(/"/, "", v); print v; exit }
    }' "$1"
}
spec_ops() { # <spec> -> "METHOD path"
  awk '/^paths:/ { inp = 1; next } inp && /^[^ ]/ { inp = 0 }
       inp && /^  [^ ].*:$/ { p = $0; sub(/^  /, "", p); sub(/:$/, "", p); gsub(/"/, "", p) }
       inp && /^    (get|put|post|delete|patch|head|options):/ { m = $1; sub(/:$/, "", m); print toupper(m) " " p }' "$1"
}
spec_server() { awk '/^servers:/ { s = 1 } s && /url:/ { sub(/.*url: */, ""); print; exit }' "$1"; }
spec_security() { awk '/^components:/ { c = 1 } c && /securitySchemes:/ { s = 1; next } s && /^    [A-Za-z]/ { k = $1; sub(/:$/, "", k); printf "%s%s", sep, k; sep = "," } s && /^  [a-z]/ { exit }' "$1"; }
contexts_of() { # <service> -> context names from runtimes/<service>/application.properties
  grep -oE '^web\.http\.[a-z]+\.port' "runtimes/$1/src/main/resources/application.properties" | cut -d. -f3 | sort -u
}

cmd="${1:-}"; shift || true
case "$cmd" in
  contexts)
    printf '%-13s %-12s %-6s %-17s %-40s %-45s %-22s %s\n' SERVICE CONTEXT PORT PATH "COMPOSE URL (host)" "HELM VALUE (port)" SPEC SECURITY
    for s in $SERVICES; do
      props="runtimes/$s/src/main/resources/application.properties"
      for c in $(contexts_of "$s"); do
        port=$(prop "$props" "web.http.$c.port"); path=$(prop "$props" "web.http.$c.path")
        hp=$(host_port "$s" "$port"); url="${hp:+http://localhost:$hp$path}"
        hv="$s.endpoints.$c.port"; v=$(yaml_get "charts/tractusx-$s/values.yaml" "$hv" || true)
        spec="docs/api/$s/$c.yaml"; sec=""
        if [ -f "$spec" ]; then sec=$(spec_security "$spec"); else spec="(no spec)"; fi
        printf '%-13s %-12s %-6s %-17s %-40s %-45s %-22s %s\n' "$s" "$c" "$port" "$path" "${url:--}" "${v:+$hv=$v}" "${spec#docs/api/}" "${sec:--}"
      done
    done
    echo
    echo "Ports differ between runtime defaults/compose and the charts; always read the deployment's values."
    echo "Compose offsets the IssuerService host ports that collide with the IdentityHub (8182, 10101, 15251, 9392)." ;;
  list)
    for f in docs/api/identityhub/*.yaml docs/api/issuerservice/*.yaml; do
      s=$(basename "$(dirname "$f")"); c=$(basename "$f" .yaml); srv=$(spec_server "$f")
      hp=$(host_port "$s" "$(echo "$srv" | sed -E 's#.*:([0-9]+).*#\1#')"); base=$(echo "$srv" | sed -E "s#:[0-9]+#:${hp:-?}#")
      spec_ops "$f" | while read -r m p; do printf '%-7s %-82s %-25s %s\n' "$m" "$p" "$s/$c" "${base%/}$p"; done
    done | grep -E -- "${1:-.}" || true ;;
  coverage)
    tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
    # URL paths used by each collection, with variables normalised to {}
    node -e '
      const fs = require("fs");
      const walk = (it, out) => { for (const x of it || []) { if (x.item) walk(x.item, out); else if (x.request) {
        const u = x.request.url; let raw = typeof u === "string" ? u : (u && (u.raw || "/" + (u.path || []).join("/")));
        out.push(`${x.request.method} ${raw}`); } } return out; };
      for (const [f, o] of [[process.argv[1], process.argv[3]], [process.argv[2], process.argv[4]]])
        fs.writeFileSync(o, walk(JSON.parse(fs.readFileSync(f)).item, []).join("\n") + "\n");
    ' "$E2E" "$REF" "$tmp/e2e" "$tmp/ref"
    find "$BRUNO" -name '*.bru' -print0 | xargs -0 awk '/^(get|post|put|delete|patch) *\{/ { m = toupper($1) } /^  url:/ { sub(/^  url: */, ""); print m " " $0 }' > "$tmp/bru"
    norm() { sed -E 's#\{\{[^}]*\}\}#{}#g; s#:[A-Za-z_]+#{}#g; s#\?.*$##; s#/+$##' "$1" | awk '{ m = $1; $1 = ""; sub(/^ /, ""); sub(/^[a-z]+:\/\/[^\/]*/, ""); sub(/^\{\}/, ""); print m " " $0 }' | sort -u; }
    norm "$tmp/e2e" > "$tmp/e2e.n"; norm "$tmp/ref" > "$tmp/ref.n"; norm "$tmp/bru" > "$tmp/bru.n"
    hit() { # <normalised file> <METHOD> <spec path>: suffix match, path params -> {}
      local re; re=$(echo "$3" | sed -E 's#\{[^}]+\}#{}#g; s#/+$##; s#[.]#\\.#g; s#\{\}#\\{\\}#g')
      grep -qE "^$2 .*$re\$" "$1" && echo x || echo -
    }
    printf '%-4s %-4s %-5s  %-7s %-82s %s\n' E2E REF BRUNO METHOD PATH SPEC
    for f in docs/api/identityhub/*.yaml docs/api/issuerservice/*.yaml; do
      s=$(basename "$(dirname "$f")")/$(basename "$f" .yaml)
      spec_ops "$f" | while read -r m p; do
        a=$(hit "$tmp/e2e.n" "$m" "$p"); b=$(hit "$tmp/ref.n" "$m" "$p"); c=$(hit "$tmp/bru.n" "$m" "$p")
        printf '%-4s %-4s %-5s  %-7s %-82s %s\n' "$a" "$b" "$c" "$m" "$p" "$s"
      done
    done | sort -k1,1 -k2,2 | grep -E -- "${1:-.}" || true
    echo; echo "x = a request with this method and path exists ({{vars}} and :params match path parameters)." ;;
  drift)
    ./gradlew -q :openapi:identityhub-spec:copyGeneratedSpecToDocs :openapi:issuerservice-spec:copyGeneratedSpecToDocs
    if git diff --quiet -- docs/api/identityhub docs/api/issuerservice; then echo "docs/api specs are up to date."; else
      git diff --stat -- docs/api/identityhub docs/api/issuerservice
      echo "The committed specs changed: review the diff, commit it, and update the collections (coverage)."; fi ;;
  ""|-h|--help|help) sed -n '/^# Inventory of the HTTP APIs/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//' ;;
  *) die "unknown command '$cmd' (try --help)" ;;
esac
