#!/usr/bin/env python3
"""
Verify a JWT-based Verifiable Credential (VC-JWT) issued by a did:web issuer.

Steps:
  1. Decode JWT header & payload (without verification first)
  2. Resolve the issuer's DID document via did:web
  3. Extract the public key matching the JWT "kid"
  4. Verify the ES256 signature
  5. Validate temporal claims (nbf, exp, iat)
  6. Check revocation via BitstringStatusList
  7. Print a structured summary

Requirements:
  pip install PyJWT cryptography requests
"""

import sys
import json
import base64
import gzip
import struct
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    import jwt  # PyJWT
    import requests
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("Missing dependencies. Install them with:")
    print("  pip install PyJWT cryptography requests")
    sys.exit(1)


# ── Helpers ──────────────────────────────────────────────────────────────────

def b64url_decode(data: str) -> bytes:
    """Base64-URL decode (add padding if needed)."""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def resolve_did_web(did: str) -> dict:
    """
    Resolve a did:web identifier to its DID document.
    did:web:example.com        -> https://example.com/.well-known/did.json
    did:web:example.com:path   -> https://example.com/path/did.json
    """
    parts = did.split(":")
    if len(parts) < 3 or parts[0] != "did" or parts[1] != "web":
        raise ValueError(f"Not a valid did:web identifier: {did}")

    domain_and_path = parts[2:]
    domain = domain_and_path[0].replace("%3A", ":")
    path_segments = domain_and_path[1:] if len(domain_and_path) > 1 else []

    if path_segments:
        url = f"https://{domain}/{'/'.join(path_segments)}/did.json"
    else:
        url = f"https://{domain}/.well-known/did.json"

    print(f"  Resolving DID document: {url}")
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


def find_verification_key(did_doc: dict, kid: str):
    """
    Find a JWK in the DID document that matches the given kid.
    Searches verificationMethod entries.
    """
    for vm in did_doc.get("verificationMethod", []):
        vm_id = vm.get("id", "")
        # kid may be fully qualified (did:web:...#key-1) or fragment only (#key-1)
        if vm_id == kid or vm_id.endswith(kid.split("#")[-1]):
            jwk = vm.get("publicKeyJwk")
            if jwk:
                return jwk
            # Also handle publicKeyMultibase / publicKeyBase58 if needed
    return None


def jwk_to_ec_public_key(jwk: dict):
    """Convert a JWK dict (EC / P-256) to a cryptography EC public key."""
    crv = jwk.get("crv", "P-256")
    if crv != "P-256":
        raise ValueError(f"Unsupported curve: {crv}")

    x = b64url_decode(jwk["x"])
    y = b64url_decode(jwk["y"])

    # Ensure 32 bytes each
    x = x.rjust(32, b"\x00")
    y = y.rjust(32, b"\x00")

    public_numbers = ec.EllipticCurvePublicNumbers(
        x=int.from_bytes(x, "big"),
        y=int.from_bytes(y, "big"),
        curve=ec.SECP256R1(),
    )
    return public_numbers.public_key(default_backend())


def fmt_ts(ts) -> str:
    """Format a Unix timestamp to ISO-8601."""
    if ts is None:
        return "—"
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    except (OSError, OverflowError, ValueError):
        return f"{ts} (out of range)"


def check_bitstring_status_list(status_list_url: str, index: int, issuer_did: str) -> dict:
    """
    Fetch a BitstringStatusListCredential, decode the bitstring,
    and check whether the bit at `index` is set.

    The status list credential can be:
      - A JWT (compact serialization) whose payload contains vc.credentialSubject.encodedList
      - A plain JSON-LD document with credentialSubject.encodedList

    The encodedList is a base64-encoded GZIP-compressed bitstring.

    Returns a dict: {"revoked": bool, "error": str|None, "details": str}
    """
    try:
        print(f"  Fetching status list: {status_list_url}")
        resp = requests.get(status_list_url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        return {"revoked": None, "error": f"Failed to fetch status list: {e}", "details": ""}

    body = resp.text.strip()
    encoded_list = None
    sl_type = None

    # Determine if the response is a JWT or JSON
    if body.startswith("ey") and body.count(".") == 2:
        # JWT format
        sl_type = "JWT"
        try:
            sl_parts = body.split(".")
            sl_payload = json.loads(b64url_decode(sl_parts[1]))
            sl_vc = sl_payload.get("vc", sl_payload)
            encoded_list = sl_vc.get("credentialSubject", {}).get("encodedList")

            # Optionally verify the status list credential's signature too
            sl_header = json.loads(b64url_decode(sl_parts[0]))
            sl_issuer = sl_payload.get("iss", "")
            if sl_issuer and sl_issuer != issuer_did:
                return {
                    "revoked": None,
                    "error": f"Status list issuer mismatch: {sl_issuer} ≠ {issuer_did}",
                    "details": "",
                }
        except Exception as e:
            return {"revoked": None, "error": f"Failed to decode status list JWT: {e}", "details": ""}
    else:
        # JSON-LD format
        sl_type = "JSON-LD"
        try:
            sl_doc = json.loads(body)
            encoded_list = sl_doc.get("credentialSubject", {}).get("encodedList")
        except Exception as e:
            return {"revoked": None, "error": f"Failed to parse status list JSON: {e}", "details": ""}

    if not encoded_list:
        return {"revoked": None, "error": "No encodedList found in status list credential", "details": f"format={sl_type}"}

    # Decode: base64 → gzip → raw bitstring bytes
    try:
        compressed = base64.b64decode(encoded_list)
        bitstring = gzip.decompress(compressed)
    except Exception as e:
        return {"revoked": None, "error": f"Failed to decode/decompress encodedList: {e}", "details": ""}

    total_bits = len(bitstring) * 8
    if index < 0 or index >= total_bits:
        return {
            "revoked": None,
            "error": f"Index {index} out of range (bitstring has {total_bits} bits)",
            "details": "",
        }

    # Check the bit: MSB-first within each byte
    byte_index = index // 8
    bit_index = 7 - (index % 8)  # MSB = bit 0
    is_set = bool(bitstring[byte_index] & (1 << bit_index))

    return {
        "revoked": is_set,
        "error": None,
        "details": f"format={sl_type}, bitstring_size={total_bits} bits, byte[{byte_index}]=0x{bitstring[byte_index]:02x}, bit_position={bit_index}",
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        token = (
            "eyJraWQiOiJkaWQ6d2ViOmlzc3Vlci1zZXJ2aWNlLmludC5jYXRlbmEteC5uZXQja2V5LTEi"
            "LCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJkaWQ6d2ViOmlkZW50aXR5LWh1Yi5pbnQuY2F0ZW5h"
            "LXgubmV0IiwibmJmIjoxNzcyNjUzMDcwLCJpc3MiOiJkaWQ6d2ViOmlzc3Vlci1zZXJ2aWNl"
            "LmludC5jYXRlbmEteC5uZXQiLCJleHAiOjEwMDAxNzcyNjUzMDcwLCJpYXQiOjE3NzI2NTMw"
            "NzAsInZjIjp7Imlzc3VhbmNlRGF0ZSI6IjIwMjYtMDMtMDRUMTk6Mzc6NTAuODE3NDIyMDMy"
            "WiIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImhvbGRlcklkZW50aWZpZXIiOiJCUE5MMDAwMDAw"
            "MDNBWVJFIiwiaWQiOiJkaWQ6d2ViOmlkZW50aXR5LWh1Yi5pbnQuY2F0ZW5hLXgubmV0In0s"
            "ImlkIjoiYTg4YWYyMzYtMTkxMi00NWE5LTljYjItMDk0NWRhZjZiYzM4IiwidHlwZSI6WyJW"
            "ZXJpZmlhYmxlQ3JlZGVudGlhbCIsIk1lbWJlcnNoaXBDcmVkZW50aWFsIl0sIkBjb250ZXh0"
            "IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImlzc3VlciI6"
            "ImRpZDp3ZWI6aXNzdWVyLXNlcnZpY2UuaW50LmNhdGVuYS14Lm5ldCIsImV4cGlyYXRpb25E"
            "YXRlIjoiKzMxODkxMy0wNy0yM1QxMzoyNDozMC44MTc0MjQ3MzJaIiwiY3JlZGVudGlhbFN0"
            "YXR1cyI6eyJzdGF0dXNQdXJwb3NlIjoicmV2b2NhdGlvbiIsInN0YXR1c0xpc3RJbmRleCI6"
            "MCwiaWQiOiI0MzkyYjQ2NC1lMjRkLTQ4MWMtYjJjMi04NTk1NTQwZjY4YTUiLCJ0eXBlIjoi"
            "Qml0c3RyaW5nU3RhdHVzTGlzdEVudHJ5Iiwic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRw"
            "czovL2lzc3Vlci1zZXJ2aWNlLmludC5jYXRlbmEteC5uZXQvYWIwZWM2ZDYtYWQwNS00NWUz"
            "LWIzNjItMDdlZGRjYTQ3MzUwIn19LCJqdGkiOiI1YjNkMzc5NS00N2IzLTRmNDktYjJhNi0y"
            "YWFhM2FjNzU5NzcifQ.PnISEGvY6O2YJwsJXostj100cYR_PiQ6YLOC1LCVTuYYpNORkYRw"
            "2Vn9KzuWUr4EFFD__vsyBB7tB7JfyCv5KA"
        )
    else:
        token = sys.argv[1]

    print("=" * 70)
    print("  JWT Verifiable Credential Verification")
    print("=" * 70)

    # ── 1. Decode header & payload (unverified) ──────────────────────────
    parts = token.split(".")
    if len(parts) != 3:
        print("ERROR: Not a valid JWT (expected 3 dot-separated parts)")
        sys.exit(1)

    header = json.loads(b64url_decode(parts[0]))
    payload = json.loads(b64url_decode(parts[1]))

    print("\n[1] JWT Header:")
    print(json.dumps(header, indent=2))

    print("\n[2] JWT Payload (VC):")
    print(json.dumps(payload, indent=2))

    alg = header.get("alg", "ES256")
    kid = header.get("kid", "")
    issuer_did = payload.get("iss", "")
    subject_did = payload.get("sub", "")

    print(f"\n  Algorithm : {alg}")
    print(f"  Key ID    : {kid}")
    print(f"  Issuer    : {issuer_did}")
    print(f"  Subject   : {subject_did}")

    # ── 2. Temporal validation ───────────────────────────────────────────
    print("\n[3] Temporal Claims:")
    now = time.time()
    iat = payload.get("iat")
    nbf = payload.get("nbf")
    exp = payload.get("exp")

    print(f"  iat (issued at)  : {fmt_ts(iat)}")
    print(f"  nbf (not before) : {fmt_ts(nbf)}")
    print(f"  exp (expires)    : {fmt_ts(exp)}")
    print(f"  now              : {fmt_ts(now)}")

    temporal_ok = True
    if nbf and now < nbf:
        print("  ⚠  Token is not yet valid (nbf is in the future)")
        temporal_ok = False
    if exp and now > exp:
        print("  ⚠  Token has expired")
        temporal_ok = False
    if temporal_ok:
        print("  ✓  Temporal claims are valid")

    # ── 3. VC content summary ────────────────────────────────────────────
    vc = payload.get("vc", {})
    print("\n[4] Verifiable Credential Content:")
    print(f"  ID          : {vc.get('id', '—')}")
    print(f"  Types       : {', '.join(vc.get('type', []))}")
    print(f"  Issuer      : {vc.get('issuer', '—')}")
    print(f"  Issuance    : {vc.get('issuanceDate', '—')}")
    print(f"  Expiration  : {vc.get('expirationDate', '—')}")

    cs = vc.get("credentialSubject", {})
    print(f"  Subject ID  : {cs.get('id', '—')}")
    print(f"  Holder BPN  : {cs.get('holderIdentifier', '—')}")

    status = vc.get("credentialStatus", {})
    if status:
        print(f"  Status Type : {status.get('type', '—')}")
        print(f"  Status List : {status.get('statusListCredential', '—')}")
        print(f"  List Index  : {status.get('statusListIndex', '—')}")
        print(f"  Purpose     : {status.get('statusPurpose', '—')}")

    # ── 4. Resolve DID & get public key ──────────────────────────────────
    print("\n[5] DID Resolution:")
    try:
        did_doc = resolve_did_web(issuer_did)
        print("  ✓  DID document retrieved")
    except Exception as e:
        print(f"  ✗  Failed to resolve DID: {e}")
        print("\n  Cannot verify signature without the public key.")
        sys.exit(1)

    jwk = find_verification_key(did_doc, kid)
    if not jwk:
        print(f"  ✗  No verification key found for kid: {kid}")
        print(f"  Available keys:")
        for vm in did_doc.get("verificationMethod", []):
            print(f"    - {vm.get('id')}")
        sys.exit(1)

    print(f"  ✓  Found public key: {kid}")
    print(f"      crv={jwk.get('crv')}  kty={jwk.get('kty')}")

    # ── 5. Verify signature ──────────────────────────────────────────────
    print("\n[6] Signature Verification:")
    try:
        public_key = jwk_to_ec_public_key(jwk)

        # PyJWT verify — disable exp check since the value may overflow
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            options={
                "verify_exp": False,   # we already checked manually
                "verify_aud": False,   # VCs don't use aud
            },
        )
        print("  ✓  Signature is VALID")
    except jwt.exceptions.InvalidSignatureError:
        print("  ✗  Signature is INVALID")
        sys.exit(1)
    except Exception as e:
        print(f"  ✗  Verification error: {e}")
        sys.exit(1)

    # ── 6. Status list (revocation) check ────────────────────────────────
    status_ok = True
    if status and status.get("type") == "BitstringStatusListEntry":
        print("\n[7] Revocation Status Check:")
        sl_url = status.get("statusListCredential", "")
        sl_index = status.get("statusListIndex", 0)
        sl_purpose = status.get("statusPurpose", "revocation")

        if sl_url:
            result = check_bitstring_status_list(sl_url, int(sl_index), issuer_did)
            if result["error"]:
                print(f"  ⚠  {result['error']}")
                if result["details"]:
                    print(f"     {result['details']}")
                status_ok = False
            elif result["revoked"]:
                print(f"  ✗  Credential is REVOKED (bit {sl_index} is set)")
                print(f"     {result['details']}")
                status_ok = False
            else:
                print(f"  ✓  Credential is NOT revoked (bit {sl_index} is clear)")
                print(f"     {result['details']}")
        else:
            print("  ⚠  No statusListCredential URL found")
            status_ok = False
    elif status:
        print("\n[7] Revocation Status Check:")
        print(f"  ⚠  Unsupported status type: {status.get('type', '—')}")
        status_ok = False
    else:
        print("\n[7] Revocation Status Check:")
        print("  —  No credentialStatus present (no revocation check)")

    # ── 7. Issuer consistency ────────────────────────────────────────────
    print("\n[8] Consistency Checks:")
    checks_ok = True

    # iss == vc.issuer
    if issuer_did != vc.get("issuer"):
        print(f"  ⚠  JWT iss ({issuer_did}) ≠ vc.issuer ({vc.get('issuer')})")
        checks_ok = False
    else:
        print(f"  ✓  JWT iss matches vc.issuer")

    # sub == credentialSubject.id
    if subject_did != cs.get("id"):
        print(f"  ⚠  JWT sub ({subject_did}) ≠ credentialSubject.id ({cs.get('id')})")
        checks_ok = False
    else:
        print(f"  ✓  JWT sub matches credentialSubject.id")

    # kid starts with issuer DID
    if not kid.startswith(issuer_did):
        print(f"  ⚠  kid does not start with issuer DID")
        checks_ok = False
    else:
        print(f"  ✓  kid references issuer DID")

    # ── Summary ──────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    all_ok = temporal_ok and checks_ok and status_ok
    if all_ok:
        print("  ✅  CREDENTIAL IS VALID (signature OK, not revoked)")
    else:
        issues = []
        if not temporal_ok:
            issues.append("temporal claims failed")
        if not checks_ok:
            issues.append("consistency checks failed")
        if not status_ok:
            issues.append("revocation check failed/credential revoked")
        print(f"  ⚠️   CREDENTIAL HAS ISSUES: {', '.join(issues)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
