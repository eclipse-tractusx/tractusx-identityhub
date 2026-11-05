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

# Resolve and lint a did:web DID document the way a verifier (connector, IssuerService) does:
# DID -> URL (did:web method spec), fetch, then check id/controller consistency, verification
# methods and their key material, verification relationships, and the DCP service entries
# (CredentialService for holders, IssuerService for issuers) including whether they answer.
#
# Usage: did-inspect.sh <did:web:...> [--http] [--probe] [--json]
#        did-inspect.sh --file did.json [--did did:web:...] [--probe]
#   --http    resolve over http instead of https (the compose stack: edc.iam.did.web.use.https=false)
#   --probe   send a request to every service endpoint and report the HTTP status
#   --json    also print the raw DID document
# Examples (compose stack):
#   did-inspect.sh did:web:identityhub%3A10100:holder --http        (inside the compose network)
#   did-inspect.sh --file <(curl -s http://localhost:10100/holder/did.json) --did did:web:identityhub%3A10100:holder
set -euo pipefail

DID=""; FILE=""; SCHEME=https; PROBE=0; RAW=0
while [ $# -gt 0 ]; do
  case "$1" in --http) SCHEME=http; shift ;; --probe) PROBE=1; shift ;; --json) RAW=1; shift ;;
    --file) FILE="$2"; shift 2 ;; --did) DID="$2"; shift 2 ;;
    -h|--help) sed -n '/^# Resolve and lint/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    did:*) DID="$1"; shift ;; *) echo "did-inspect: unknown argument $1" >&2; exit 1 ;; esac
done
command -v node >/dev/null || { echo "did-inspect: node is required" >&2; exit 1; }
[ -n "$DID$FILE" ] || { echo "did-inspect: give a did:web DID or --file (try --help)" >&2; exit 1; }

URL=""
if [ -n "$DID" ]; then
  case "$DID" in did:web:*) ;; *) echo "did-inspect: only did:web is supported (got $DID)" >&2; exit 1 ;; esac
  # did:web:<host>[%3A<port>][:<path>:<segments>] -> <scheme>://<host>[:<port>]/<path>/<segments>/did.json
  rest="${DID#did:web:}"; host="${rest%%:*}"; host="${host//%3A/:}"; host="${host//%3a/:}"
  if [ "$rest" = "${rest#*:}" ]; then path="/.well-known"; else path="/$(echo "${rest#*:}" | tr ':' '/')"; fi
  URL="$SCHEME://$host$path/did.json"
fi
echo "DID : ${DID:-(from file)}"
[ -n "$URL" ] && echo "URL : $URL"
TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
if [ -n "$FILE" ]; then cat "$FILE" > "$TMP"; else
  code=$(curl -s -o "$TMP" -w '%{http_code}' --max-time 15 "$URL" || true)
  echo "HTTP: $code"
  if [ "$code" != 200 ]; then
    echo "FAIL  DID document not retrievable (HTTP $code). Check: DID published (POST …/dids/publish),"
    echo "      the did web context port/path, ingress, and http vs https (edc.iam.did.web.use.https)."
    head -c 400 "$TMP"; echo; exit 2
  fi
fi

node - "$TMP" "$DID" "$PROBE" "$RAW" <<'JS'
const fs = require("fs");
const [file, did, probe, raw] = process.argv.slice(2);
let doc; try { doc = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.log("FAIL  not JSON: " + e.message); process.exit(2); }
let fails = 0, warns = 0;
const ok = (m) => console.log("ok    " + m), fail = (m) => { fails++; console.log("FAIL  " + m); }, warn = (m) => { warns++; console.log("WARN  " + m); };
const id = doc.id;
console.log("\n== Identity");
if (!id) fail("no 'id'"); else if (did && id !== did) fail(`id '${id}' does not match the resolved DID '${did}' (verifiers reject it)`); else ok(`id ${id}`);
const ctx = [].concat(doc["@context"] || []);
ctx.length ? ok(`@context: ${ctx.join(", ")}`) : warn("no @context");

console.log("\n== Verification methods");
const vms = [].concat(doc.verificationMethod || []);
if (!vms.length) fail("no verificationMethod: nobody can verify tokens or credentials signed by this DID");
const vmIds = new Set();
for (const vm of vms) {
  const full = vm.id && vm.id.startsWith("#") ? id + vm.id : vm.id; vmIds.add(full); vmIds.add(vm.id);
  const jwk = vm.publicKeyJwk || {};
  const key = vm.publicKeyJwk ? `jwk kty=${jwk.kty}${jwk.crv ? " crv=" + jwk.crv : ""}${jwk.alg ? " alg=" + jwk.alg : ""}` : vm.publicKeyMultibase ? "multibase" : "NO KEY MATERIAL";
  console.log(`      ${vm.id}  type=${vm.type}  ${key}`);
  if (vm.controller && id && vm.controller !== id) warn(`${vm.id}: controller ${vm.controller} != id`);
  if (!vm.publicKeyJwk && !vm.publicKeyMultibase) fail(`${vm.id}: no publicKeyJwk/publicKeyMultibase`);
  if (vm.publicKeyJwk && (jwk.d || jwk.p || jwk.q)) fail(`${vm.id}: PRIVATE key material published in the DID document!`);
  if (full && !full.startsWith(id + "#")) warn(`${vm.id}: not a fragment of the DID (kid in tokens will be '${id}#…')`);
}
console.log("\n== Verification relationships");
for (const rel of ["authentication", "assertionMethod", "keyAgreement", "capabilityInvocation", "capabilityDelegation"]) {
  const refs = [].concat(doc[rel] || []);
  if (!refs.length) { if (rel === "assertionMethod" || rel === "authentication") console.log(`      ${rel}: (none)`); continue; }
  for (const r of refs) { const rid = typeof r === "string" ? r : r.id; const full = rid && rid.startsWith("#") ? id + rid : rid;
    vmIds.has(full) || vmIds.has(rid) || typeof r === "object" ? console.log(`      ${rel}: ${rid}`) : fail(`${rel} references unknown method ${rid}`); }
}

console.log("\n== Services");
const svcs = [].concat(doc.service || []);
if (!svcs.length) warn("no service entries: connectors cannot find a CredentialService, holders cannot find an IssuerService");
const types = svcs.map((s) => [].concat(s.type).join(","));
for (const s of svcs) console.log(`      ${[].concat(s.type).join(",").padEnd(18)} ${s.id}  ->  ${typeof s.serviceEndpoint === "string" ? s.serviceEndpoint : JSON.stringify(s.serviceEndpoint)}`);
const cs = svcs.find((s) => [].concat(s.type).includes("CredentialService"));
const is = svcs.find((s) => [].concat(s.type).includes("IssuerService"));
if (cs) {
  const ep = String(cs.serviceEndpoint);
  /\/v1\/participants\/[^/]+\/?$/.test(ep) ? ok("CredentialService points at …/v1/participants/<participantContextId> (DCP presentation API base)")
    : warn("CredentialService endpoint does not end with /v1/participants/<participantContextId>; connectors append /presentations/query to it");
  if (/\/participants\/[A-Za-z0-9_-]+={0,2}$/.test(ep) && !/did:|%3A/.test(ep) && /^[A-Za-z0-9_-]{12,}={0,2}$/.test(ep.split("/").pop()))
    warn("participantContextId in the endpoint looks base64-encoded; since EDC 0.17.0 it is used verbatim in URLs");
} else if (!is) warn("neither CredentialService (holder) nor IssuerService (issuer) present");
if (is) { ok(`IssuerService present (issuer DID): ${is.serviceEndpoint}`); if (![].concat(doc.assertionMethod || []).length) warn("issuer DID without assertionMethod: verifiers may reject credentials whose kid is not an assertion key"); }
if (types.length !== new Set(svcs.map((s) => s.id)).size) warn("duplicate service ids");

const done = () => { console.log(`\nSummary: ${fails} FAIL, ${warns} WARN`); if (raw === "1") console.log("\n" + JSON.stringify(doc, null, 2)); process.exit(fails ? 1 : 0); };
if (probe === "1" && svcs.length) {
  console.log("\n== Probing service endpoints (any HTTP answer = reachable; 401/405 are expected without a token)");
  Promise.all(svcs.map((s) => { const u = String(s.serviceEndpoint); const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    return fetch(u, { method: "GET", signal: ctl.signal }).then((r) => console.log(`      ${String(r.status).padEnd(4)} ${u}`))
      .catch((e) => { fails++; console.log(`FAIL  unreachable ${u} (${e.cause ? e.cause.code || e.cause.message : e.message})`); })
      .finally(() => clearTimeout(t)); })).then(done);
} else done();
JS
