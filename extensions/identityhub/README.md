# Identity management ownership extensions

The Tractus-X runtimes assemble the official EDC/IdentityHub 0.18.0 artifacts
together with two local extensions. Both are built from this repository and
registered through the normal EDC service lifecycle. No replacement upstream
classes, dependency substitution, external patch JAR or classpath ordering is
needed.

| Module | Runtime assemblies | Additional checks |
| --- | --- | --- |
| `participant-api-ownership` | Holder and Issuer, memory and SQL | Authorize participant activation/deactivation and deletion before mutation |
| `credential-api-ownership` | Holder, memory and SQL | Bind credential POST/PUT manifests and holder request lookups to the path participant |

The extensions register Jakarta REST method-bound providers on the Identity API
using EDC's `WebService`. They retain the upstream controllers, authentication,
scope filters, JSON readers, validation, transformation and persistence. Resource
checks run after authentication and scope checks. The existing
`AuthorizationService` decides participant access, including administrator access.
Credential manifests are checked after deserialization but before controller
execution, without parsing or modifying the request body a second time.

Both the path and body of a credential write must identify the same participant,
including for administrators. A holder request belonging to another path
participant returns the same HTTP 404 as a missing request. For this one lookup
method, the provider returns the upstream response DTO from the same checked
record. It completes the request before the original controller can retrieve a
different record in a second store lookup. All other bound operations continue
through the upstream controller after validation.
Ordinary participant mutation denial retains the existing HTTP 403 mapping.
Denied writes do not reach the mutation/store service.

The Issuer assembly includes only the participant module: adding the Holder
credential API to the Issuer would expand its API and dependency surface.
The same assembly rules apply to the OAuth2 BOM variants. There is no feature
flag that disables these checks. Clients need no new headers or endpoints.
This change adds no database migration and does not change STS, Presentation,
DID documents, DCP, credential signatures or CP/DP code.

These providers are deliberately bound to the exact resource classes and methods
of EDC 0.18.0. When upgrading EDC again, review those bindings and rerun the HTTP
regressions against each runtime assembly. Remove an extension only when the
standard assembled runtime preserves the same ownership guarantees.
Literal-percent URI handling and health endpoint startup behavior are separate
checks and are not changed by these extensions.

## Validation

Run the two module test tasks for real HTTP requests against the unmodified EDC
controllers with the Tractus-X providers registered. Tests cover both A/B
directions, owner/admin success, scope and authentication ordering, denied-write
side effects, mismatched/missing manifests, unknown requests, a changing lookup
result and unaffected routes.

```shell
./gradlew :extensions:identityhub:participant-api-ownership:test \
  :extensions:identityhub:credential-api-ownership:test
```

## Source contracts

- [EDC 0.18 WebService resource registration](https://github.com/eclipse-edc/Connector/blob/911a22ba6b90688ffeb35bb92bf5cc040ffdf37f/spi/common/web-spi/src/main/java/org/eclipse/edc/web/spi/WebService.java)
- [EDC 0.18 scope filter priority](https://github.com/eclipse-edc/Connector/blob/911a22ba6b90688ffeb35bb92bf5cc040ffdf37f/extensions/common/auth/auth-authorization-oauth2-lib/src/main/java/org/eclipse/edc/api/authorization/filter/ScopeBasedAccessFilter.java)
- [Jakarta REST 4.0 method-bound providers](https://jakarta.ee/specifications/restful-ws/4.0/apidocs/jakarta.ws.rs/jakarta/ws/rs/container/dynamicfeature)
- [Jakarta REST 4.0 entity reader interception](https://jakarta.ee/specifications/restful-ws/4.0/apidocs/jakarta.ws.rs/jakarta/ws/rs/ext/readerinterceptor)
