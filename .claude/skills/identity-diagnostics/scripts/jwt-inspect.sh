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

# Decode and lint the JWTs of a DCP flow WITHOUT verifying signatures: self-issued ID tokens from
# the STS, access tokens, Verifiable Presentations (vp_token) and Verifiable Credentials (also the
# ones nested inside a VP). Prints header and claims, converts timestamps, flags expired or
# not-yet-valid tokens, mismatched iss/sub/aud, and shows each credential's type, issuer, subject,
# validity and status entry.
#
# Usage: jwt-inspect.sh <jwt | file | -> [--did-check] [--http]
#   --did-check   resolve the issuer DID (did:web) and check that the header kid is one of its
#                 verification methods (uses did-inspect.sh's resolution rules)
#   --http        resolve did:web over http (compose stack)
# Accepts a bare JWT, "Bearer <jwt>", a JSON response containing "presentation"/"vp_token"/
# "access_token"/"token" fields, or a file holding any of these.
# Never paste production tokens into tickets: the output contains the full claims.
set -euo pipefail

IN=""; DIDCHECK=0; SCHEME=https
while [ $# -gt 0 ]; do
  case "$1" in --did-check) DIDCHECK=1; shift ;; --http) SCHEME=http; shift ;;
    -h|--help) sed -n '/^# Decode and lint/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) IN="$1"; shift ;; esac
done
command -v node >/dev/null || { echo "jwt-inspect: node is required" >&2; exit 1; }
[ -n "$IN" ] || { echo "jwt-inspect: give a JWT, a file or - (try --help)" >&2; exit 1; }
if [ "$IN" = - ]; then DATA=$(cat); elif [ -f "$IN" ]; then DATA=$(cat "$IN"); else DATA="$IN"; fi

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT; printf '%s' "$DATA" > "$TMP"
node - "$TMP" "$DIDCHECK" "$SCHEME" <<'JS'
const [file, didcheck, scheme] = process.argv.slice(2);
let input = require("fs").readFileSync(file, "utf8").trim().replace(/^Bearer\s+/i, "");
let fails = 0, warns = 0;
const fail = (m) => { fails++; console.log("FAIL  " + m); }, warn = (m) => { warns++; console.log("WARN  " + m); }, ok = (m) => console.log("ok    " + m);
const isJwt = (s) => typeof s === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(s);
const b64 = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const t = (n) => (typeof n === "number" ? `${n} (${new Date(n * 1000).toISOString()})` : String(n));
const now = Math.floor(Date.now() / 1000);

// find JWTs in JSON input
let tokens = [];
if (isJwt(input)) tokens.push(["token", input]);
else { try { const j = JSON.parse(input); const walk = (o, p) => { if (isJwt(o)) tokens.push([p, o]); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, p ? p + "." + k : k); }; walk(j, ""); }
       catch { console.log("FAIL  input is neither a JWT nor JSON containing JWTs"); process.exit(2); } }
if (!tokens.length) { console.log("FAIL  no JWT found in the input"); process.exit(2); }

const checks = [];
function inspect(label, jwt, depth) {
  const pad = "  ".repeat(depth);
  const [h, p] = jwt.split(".");
  let header, claims;
  try { header = JSON.parse(b64(h)); claims = JSON.parse(b64(p)); } catch (e) { fail(`${label}: cannot decode (${e.message})`); return; }
  const kind = claims.vp ? "Verifiable Presentation (JWT)" : claims.vc || (claims.type && [].concat(claims.type).includes("VerifiableCredential")) ? "Verifiable Credential (JWT)"
    : claims.token ? "Self-issued ID token (carries an access token in 'token')" : claims.bearer_access_scope || claims.scope ? "Access/ID token with scopes" : "JWT";
  console.log(`\n${pad}== ${label}: ${kind}`);
  console.log(`${pad}header: alg=${header.alg} kid=${header.kid || "-"} typ=${header.typ || "-"}`);
  for (const k of ["iss", "sub", "aud", "jti", "client_id", "scope", "bearer_access_scope"]) if (claims[k] !== undefined) console.log(`${pad}${k.padEnd(20)} ${JSON.stringify(claims[k])}`);
  for (const k of ["iat", "nbf", "exp"]) if (claims[k] !== undefined) console.log(`${pad}${k.padEnd(20)} ${t(claims[k])}`);
  if (claims.exp !== undefined && claims.exp < now) fail(`${label}: expired ${now - claims.exp}s ago`);
  if (claims.nbf !== undefined && claims.nbf > now + 30) fail(`${label}: not valid before ${t(claims.nbf)} (clock skew?)`);
  if (!header.kid) warn(`${label}: no kid header; verifiers cannot pick the key from the DID document`);
  else if (claims.iss && String(claims.iss).startsWith("did:") && !String(header.kid).startsWith(claims.iss) && !String(header.kid).startsWith("#")) warn(`${label}: kid '${header.kid}' is not a key of iss '${claims.iss}'`);
  if (claims.iss && claims.sub && kind.startsWith("Self-issued") && claims.iss !== claims.sub) warn(`${label}: self-issued token with iss != sub`);
  if (header.kid && claims.iss && String(claims.iss).startsWith("did:web:")) checks.push([label, String(claims.iss), String(header.kid)]);
  if (claims.token && isJwt(claims.token)) inspect(`${label} > token`, claims.token, depth + 1);
  const vp = claims.vp;
  if (vp) {
    console.log(`${pad}vp.type ${JSON.stringify(vp.type)}  holder ${vp.holder || claims.iss}`);
    const vcs = [].concat(vp.verifiableCredential || []);
    if (!vcs.length) warn(`${label}: presentation contains no credentials (scope did not match any stored credential?)`);
    vcs.forEach((vc, i) => { if (isJwt(vc)) inspect(`${label} > vc[${i}]`, vc, depth + 1); else describeVc(`${label} > vc[${i}] (embedded JSON-LD)`, vc, depth + 1); });
  }
  if (claims.vc || kind.startsWith("Verifiable Credential")) describeVc(`${label} credential`, claims.vc || claims, depth, claims);
}
function describeVc(label, vc, depth, envelope = {}) {
  const pad = "  ".repeat(depth);
  const types = [].concat(vc.type || []); const subj = [].concat(vc.credentialSubject || [])[0] || {};
  const issuer = typeof vc.issuer === "object" ? vc.issuer.id : vc.issuer || envelope.iss;
  console.log(`${pad}type                 ${types.join(", ")}`);
  console.log(`${pad}issuer               ${issuer}`);
  console.log(`${pad}subject              ${subj.id || envelope.sub || "-"}${subj.holderIdentifier ? "  holderIdentifier=" + subj.holderIdentifier : ""}`);
  const from = vc.validFrom || vc.issuanceDate, until = vc.validUntil || vc.expirationDate;
  if (from) console.log(`${pad}valid from           ${from}`);
  if (until) { console.log(`${pad}valid until          ${until}`); if (Date.parse(until) < Date.now()) fail(`${label}: credential expired at ${until}`); }
  for (const st of [].concat(vc.credentialStatus || [])) console.log(`${pad}status               ${st.type} purpose=${st.statusPurpose || "-"} index=${st.statusListIndex ?? "-"} list=${st.statusListCredential || "-"}`);
  if (!vc.credentialStatus) console.log(`${pad}status               (none: cannot be revoked)`);
  const extra = Object.keys(subj).filter((k) => k !== "id"); if (extra.length) console.log(`${pad}claims               ${extra.join(", ")}`);
}
for (const [label, jwt] of tokens) inspect(label || "token", jwt, 0);

async function didChecks() {
  for (const [label, iss, kid] of checks) {
    const rest = iss.slice("did:web:".length); const [hostEnc, ...segs] = rest.split(":");
    const host = decodeURIComponent(hostEnc); const url = `${scheme}://${host}/${segs.length ? segs.join("/") : ".well-known"}/did.json`;
    try {
      const r = await fetch(url); if (r.status !== 200) { fail(`${label}: issuer DID ${iss} -> HTTP ${r.status} at ${url}`); continue; }
      const doc = await r.json(); const ids = [].concat(doc.verificationMethod || []).map((v) => (v.id.startsWith("#") ? doc.id + v.id : v.id));
      const k = kid.startsWith("#") ? iss + kid : kid;
      ids.includes(k) ? ok(`${label}: kid ${kid} is a verification method of ${iss}`) : fail(`${label}: kid ${kid} not in ${iss} (has: ${ids.join(", ") || "none"}) - rotated or revoked key?`);
    } catch (e) { fail(`${label}: cannot resolve ${url} (${e.cause ? e.cause.code || e.cause.message : e.message})`); }
  }
}
(didcheck === "1" ? (console.log("\n== DID checks"), didChecks()) : Promise.resolve()).then(() => {
  console.log(`\nSummary: ${fails} FAIL, ${warns} WARN (signatures NOT verified)`); process.exit(fails ? 1 : 0); });
JS
