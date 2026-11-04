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

# Run the DCP end-to-end flow exactly like CI (.github/workflows/postman-e2e-test.yaml): build the
# runtime jars, start the Docker Compose stack for a profile, wait for health, extract the
# super-user API keys from the startup logs, and run the Postman collection
# docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json with newman.
#
# Profiles: sql    = identityhub + issuerservice with PostgreSQL + HashiCorp Vault (full flow)
#           memory = identityhub-memory + issuerservice-memory (health, setup and cleanup only:
#                    the *-memory runtimes have no `database` attestation source)
#
# Usage: dcp-e2e.sh <command> [profile] [args]
#   folders                         list the collection's folders and request counts
#   build  <profile>                ./gradlew shadowJar for the profile's two runtimes
#   up     <profile>                docker compose up -d --build, then wait until both are healthy
#   keys   <profile>                print the super-user API keys (IH_SUPERUSER_KEY / IS_SUPERUSER_KEY)
#   newman <profile> [--folder F]…  run the collection against a running stack (memory: CI folders by default)
#   run    <profile> [--keep] [--folder F]…   build + up + newman like CI; tears down unless --keep
#   logs   <profile> [service] [N]  last N (default 200) log lines of one or both runtimes
#   down   <profile>                docker compose down -v (removes volumes)
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
COMPOSE_DIR=deployment/docker
COLLECTION=docs/api/postman/Tractus-X_IdentityHub_Local_E2E.json
NEWMAN_VERSION="${NEWMAN_VERSION:-6.2.2}"   # same pin as CI
die() { echo "dcp-e2e: $*" >&2; exit 1; }

services() { # <profile> -> "identityhub-service issuerservice-service"
  case "$1" in
    sql) echo "identityhub issuerservice" ;;
    memory) echo "identityhub-memory issuerservice-memory" ;;
    *) die "profile must be 'sql' or 'memory' (got '${1:-}')" ;;
  esac
}
need_docker() { docker info >/dev/null 2>&1 || die "Docker is not running (docker info failed). Start Docker Desktop / the daemon first."; }
dc() { local p="$1"; shift; (cd "$COMPOSE_DIR" && docker compose --profile "$p" "$@"); }
extract_key() { # <profile> <service>
  dc "$1" logs "$2" 2>/dev/null | grep -a "API Key" | perl -pe 's/\e\[[0-9;]*m//g' | sed 's/.*API Key: //' | tr -d '[:space:]' | tail -c 512
}
wait_healthy() {
  local i ih is
  for i in $(seq 1 60); do
    ih=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8181/api/check/health || true)
    is=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8182/api/check/health || true)
    if [ "$ih" = 200 ] && [ "$is" = 200 ]; then echo "both runtimes healthy"; return 0; fi
    sleep 3
  done
  die "runtimes did not become healthy (identityhub=$ih issuerservice=$is); see: dcp-e2e.sh logs <profile>"
}
get_keys() { # sets IH_KEY / IS_KEY, polling because the key is logged after health turns green
  local p="$1" i ihs iss; read -r ihs iss <<< "$(services "$p")"
  IH_KEY=""; IS_KEY=""
  for i in $(seq 1 40); do
    IH_KEY=$(extract_key "$p" "$ihs"); IS_KEY=$(extract_key "$p" "$iss")
    [ -n "$IH_KEY" ] && [ -n "$IS_KEY" ] && return 0
    sleep 3
  done
  die "failed to extract the super-user API keys from the logs of $ihs / $iss"
}
run_newman() { # <profile> [--folder F]...
  local p="$1"; shift
  local folders=("$@")
  if [ "$p" = memory ] && [ ${#folders[@]} -eq 0 ]; then
    folders=(--folder "00 · Health" --folder "01 · Issuer Setup" --folder "02 · Holder Setup" --folder "99 · Cleanup")
  fi
  get_keys "$p"
  echo "Running $COLLECTION with newman@$NEWMAN_VERSION (${#folders[@]} folder args) ..."
  npx --yes "newman@$NEWMAN_VERSION" run "$COLLECTION" \
    --env-var "IH_SUPERUSER_KEY=$IH_KEY" --env-var "IS_SUPERUSER_KEY=$IS_KEY" ${folders[@]+"${folders[@]}"}
}

cmd="${1:-}"; shift || true
case "$cmd" in
  folders)
    command -v node >/dev/null || die "node is required"
    node -e '
      const c = require(process.argv[1]);
      const count = (it) => (it.item ? it.item.reduce((n, x) => n + count(x), 0) : 1);
      for (const f of c.item) console.log(`${String(count(f)).padStart(3)} requests  ${f.name}`);
    ' "$ROOT/$COLLECTION" ;;
  build)
    read -r ihs iss <<< "$(services "${1:-}")"
    ./gradlew ":runtimes:$ihs:shadowJar" ":runtimes:$iss:shadowJar" ;;
  up)
    services "${1:-}" >/dev/null; need_docker
    dc "$1" up -d --build; wait_healthy ;;
  keys)
    services "${1:-}" >/dev/null; need_docker; get_keys "$1"
    echo "IH_SUPERUSER_KEY=$IH_KEY"; echo "IS_SUPERUSER_KEY=$IS_KEY" ;;
  newman)
    p="${1:-}"; services "$p" >/dev/null; shift || true; need_docker; run_newman "$p" "$@" ;;
  run)
    p="${1:-}"; services "$p" >/dev/null; shift || true; need_docker
    keep=0; args=()
    while [ $# -gt 0 ]; do case "$1" in --keep) keep=1; shift ;; *) args+=("$1"); shift ;; esac; done
    read -r ihs iss <<< "$(services "$p")"
    ./gradlew ":runtimes:$ihs:shadowJar" ":runtimes:$iss:shadowJar"
    dc "$p" up -d --build
    rc=0
    { wait_healthy && run_newman "$p" ${args[@]+"${args[@]}"}; } || rc=$?
    if [ "$rc" != 0 ]; then
      echo "===== $ihs (last 100) ====="; dc "$p" logs "$ihs" | tail -100
      echo "===== $iss (last 100) ====="; dc "$p" logs "$iss" | tail -100
    fi
    if [ "$keep" = 1 ]; then echo "Stack left running (--keep). Tear down with: $0 down $p"; else dc "$p" down -v; fi
    exit "$rc" ;;
  logs)
    p="${1:-}"; read -r ihs iss <<< "$(services "$p")"; need_docker
    n="${3:-200}"
    if [ -n "${2:-}" ]; then dc "$p" logs "$2" | tail -"$n"; else
      echo "===== $ihs ====="; dc "$p" logs "$ihs" | tail -"$n"; echo "===== $iss ====="; dc "$p" logs "$iss" | tail -"$n"; fi ;;
  down)
    services "${1:-}" >/dev/null; need_docker; dc "$1" down -v ;;
  ""|-h|--help|help) sed -n '/^# Run the DCP end-to-end/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//' ;;
  *) die "unknown command '$cmd' (try --help)" ;;
esac
