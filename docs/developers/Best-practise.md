# Developers Guide

This guide is intended to help developers understand the architecture and the processing flow involved in the Identity Hub and the Issuer Service.

## 1. Developer Guidelines

### API Access

- **IssuerService API**: Manages verifiable credential definitions, rules, and status, as well as its metadata.
- **Identity API**: Administrative operations for managing keys, DIDs, and participant contexts. Elevated privileges required for mutation.

### Module Extension

- Use **SPI modules** to customize credential storage, attestation sources, or delivery mechanisms.
- Register **custom CredentialRules** or **AttestationSources** via the IssuerService registries.

### Token Validation

- All requests require **STS-issued tokens** scoped to the participant context.
- Tokens are verified against **signature, scope, and claims** before processing.

## 2. Best Practices

- Do **not store full VCs** on the issuer side; store only metadata for auditing and revocation.
- Enable **auto-renewal** for credentials that expire frequently.
- Subscribe to **participant context events** to synchronize resource lifecycle operations.
- Use **SPIs for extensibility** instead of modifying core modules directly.
- Monitor **issuance processes** to detect `ERRORED` states and implement retry or alert mechanisms.

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>
