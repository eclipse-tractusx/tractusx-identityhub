# OpenAPI spec generation

Two modules generate the OpenAPI specifications at build time by scanning the EDC API controllers:
`identityhub-spec` for the IdentityHub runtimes and `issuerservice-spec` for the IssuerService
runtimes. IdentityHub (holder) and IssuerService (issuer) run as separate processes with different
API surfaces, so a single merged file would misrepresent each service and risk path collisions.

## One spec per web context

Each service generates **one specification per web context**, not one per service.

A runtime serves its APIs on several web contexts, and each context is a different port and base
path. OpenAPI attaches `servers` to the document rather than to an operation, so a single document
covering several contexts has no way to say that `/check/health` is on `:8181` while
`/v1/participants` is on `:15151`. Swagger UI would resolve every request against whichever
origin happened to serve the page, and every operation outside that one context would return 404.

| Service | Contexts | Paths |
|---|---|---|
| IdentityHub | default, identity, credentials, sts, did | 33 |
| IssuerService | default, identity, issueradmin, issuance, sts, did | 32 |

The `statuslist` context of the IssuerService has no spec: its only controller carries no OpenAPI
annotations upstream, so it would produce an empty document.

The ports and paths in each spec's `servers` entry are the local development defaults from each
runtime's `application.properties`. In a chart deployment the host differs, so Swagger UI's server
field is editable.

## Why controllers are listed by class

Each context names its controller classes explicitly in `build.gradle.kts` rather than naming
packages. Two reasons, both load-bearing:

1. The swagger plugin treats `resourceClasses` and `resourcePackages` as **alternatives**, not as a
   union. Setting both silently ignores the packages.
2. Package scanning matches **subpackages**, and one context boundary falls inside a package tree:
   `ParticipantContextApiController` (identity context, `:15151`) sits in a subpackage of
   `PresentationApiController`'s package (credentials context, `:13131`). Scanning the parent
   package pulls both into one spec, which is the bug this layout exists to prevent.

The cost is that an upstream rename silently drops endpoints. Two things catch it: each resolve
task fails if its spec comes out with no paths, and the `docs/api` drift check in `verify.yaml`
fails when the committed specs stop matching what the build produces.

## Regenerating

The per-context specs are generated into each runtime jar automatically during `./gradlew build`.

The committed reference copies under `docs/api/<service>/` are refreshed on demand, deliberately
not wired into `build`, so a normal build never mutates tracked files:

```bash
./gradlew :openapi:identityhub-spec:copyGeneratedSpecToDocs \
          :openapi:issuerservice-spec:copyGeneratedSpecToDocs
```

CI runs exactly this and then `git diff --exit-code docs/api`, so a pull request that changes the
API has to commit the regenerated specs.

## Adding a context

Add an `ApiContext` to the `contexts` list in the relevant module's `build.gradle.kts` with its id,
title, description, server URL, controller classes and auth mode (`apikey`, `dcp` or none). The
resolve task, the bundled index and the `docs/api` copy follow automatically.


## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
* SPDX-FileCopyrightText: 2026 VDBP
* Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/openapi/README.md>
