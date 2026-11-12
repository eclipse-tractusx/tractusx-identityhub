# Identity management ownership regressions

EDC / IdentityHub 1.0.0-RC5 includes the ownership checks previously supplied by
the two Tractus-X extensions. The runtimes now use the upstream controllers and
scope filter directly. The `participant-api-ownership` and
`credential-api-ownership` modules retain HTTP regression tests and have no
runtime providers or service registrations.

Participant deletion requires ownership authorization. Activation and
deactivation now require `identity-api:admin`, including when changing one's own
participant. Credential POST/PUT manifests must match the participant in the
path, including for administrators. A credential request belonging to another
participant returns the same 404 as a missing request; the response uses the
single record checked for ownership.

Credential request IDs are assigned by IdentityHub. Clients must omit `holderPid`
and use the `Location` response header for polling. Credential discriminator
mappings are scoped to their participant.

## Validation

The tests exercise real HTTP requests against the unmodified RC5 controllers
with authentication and scope filtering. They cover both A/B directions,
owner/admin behavior, denied-write side effects, mismatched/missing manifests,
unknown requests, a changing lookup result, server-assigned request IDs,
request validation and participant-scoped discriminator mappings.

```shell
./gradlew :extensions:identityhub:participant-api-ownership:test \
  :extensions:identityhub:credential-api-ownership:test
```

The same official APIs are assembled in memory and SQL runtimes. These tests
are also required when changing the dependency version again.

## Source contracts

- [RC5 participant controller](https://github.com/eclipse-edc/IdentityHub/blob/v1.0.0-RC5/extensions/api/identity-api/participant-context-api/src/main/java/org/eclipse/edc/identityhub/api/verifiablecredential/v1/unstable/ParticipantContextApiController.java)
- [RC5 credential controller](https://github.com/eclipse-edc/IdentityHub/blob/v1.0.0-RC5/extensions/api/identity-api/verifiable-credentials-api/src/main/java/org/eclipse/edc/identityhub/api/verifiablecredentials/v1/unstable/VerifiableCredentialsApiController.java)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
* SPDX-FileCopyrightText: 2026 VDBP
* Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/extensions/identityhub/README.md>
