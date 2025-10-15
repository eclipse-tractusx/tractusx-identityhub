# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changes in other Tractus-X components, see the [Eclipse Tractus-X Changelog](https://eclipse-tractusx.github.io/changelog).

## [Unreleased]

### Added

- Add CHANGELOG.md file following TRG 1.03 standards by @CDiezRodriguez in [#151](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/151)
- Add installation and deployment documentation, enhance documentation structure, fix header and list formatting, add license headers and NOTICE files, set key signing alias default configuration by @AYaoZhan in [#147](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/147)
- Add helm charts release by @AYaoZhan in [#119](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/119)
- Add Tractus-X specific configurations by @matbmoser in [#113](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/113)
- Add properties template functionality by @AYaoZhan in [#100](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/100)
- Add OpenAPI specification and Bruno Collection for interface documentation by @CDiezRodriguez in [#85](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/85)

### Changes

- Update dependency files and IdentityHub to version 0.14.0 by @M-Busk in [#140](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/140)
- Update Bitnami images by @CDiezRodriguez in [#130](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/130)

### Fixed

- Fix ingress path values configuration, add STS/accounts/version endpoint configuration, fix credentials configuration issues and API endpoint naming by @AYaoZhan in [#118](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/118)

## [0.0.1] - 2025-07-16

### Added

- SuperUser seeder to enable API key generation in Issuer Service by @CDiezRodriguez in [#97](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/97)
- Unified identity hub with issuer service by @CDiezRodriguez in [#65](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/65)
- Modularized SuperUserSeedExtension for better structure by @CDiezRodriguez in [#102](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/102)
- Eclipse Foundation contributors to license header by @CDiezRodriguez in [#61](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/61)
- Default value for JAR build argument by @AYaoZhan in [#84](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/84)
- Helm deployment documentation for localhost by @AYaoZhan in [#89](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/89)
- TRG 5.02 Helm chart standards by @CDiezRodriguez in [#79](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/79)

### Changed

- Upgraded EDC version to 0.14.0-SNAPSHOT by @CDiezRodriguez in [#54](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/54)
- Removed local issue templates by @marcelruland in [#59](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/59)

### Fixed

- Gitflow trigger dockerfile publish by @AYaoZhan in [#91](https://github.com/eclipse-tractusx/tractusx-identityhub/pull/91)

---

**Note:** This changelog will be updated with each release. For detailed technical changes, please refer to the individual pull requests and issues in the [GitHub repository](https://github.com/eclipse-tractusx/tractusx-identityhub).

**Links:**

- [Eclipse Tractus-X Changelog](https://github.com/eclipse-tractusx/tractus-x-release/blob/main/CHANGELOG.md)
- [TRG 1.03](https://eclipse-tractusx.github.io/docs/release/trg-1/trg-1-3)
