# Tractus-X IdentityHub - a comprehensive DCP Wallet

| [!WARNING] this project is under heavy development, expect bugs, problems and radical changes! |
|------------------------------------------------------------------------------------------------|

Welcome Contributor! Feel free to join our EDC Weeklys if you want to contibute, or our office hours.
You will find the links here: https://eclipse-tractusx.github.io/community/open-meetings#EDC%20Weekly%20|%20Extended

We are working at the moment to bring the current implemented functionalities from the upstream identity hub, test and integrate them here to offer a deployment in Helm Charts and publish our images in docker hub, so you can use also this wallet.


## About The Project

The Tractus-X IdentityHub is a specialized variant of
the [IdentityHub project](https://github.com/eclipse-edc/IdentityHub/).
It contains a DCP CredentialService implementation and a SecureTokenService, preconfigured for use in Tractus-X.

## Getting started

As all Tractus-X applications, IdentityHub is distributed as helm chart, of which there are two variants:

1. `tractusx-identityhub`: the recommended, production-ready version that uses PostgreSQL as database and Hashicorp
   Vault as secret storage.
2. `tractusx-identityhub-memory`: an ephemeral, memory-only version that stores data and secrets in memory. **Please
   only use this for demo or testing purposes!**

Please refer to the respective [documentation](./charts/tractusx-identityhub/README.md) for more information on how to
run it.

> Note that running the application natively as Java process, or directly as Docker image is possible, but is not
> supported by the Tractus-X IdentityHub team. Please use the official Helm chart.

## License

Distributed under the Apache 2.0 License.
See [LICENSE](https://github.com/eclipse-tractusx/tractusx-edc/blob/main/LICENSE) for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/eclipse-tractusx/tractusx-identityhub.svg?style=for-the-badge

[contributors-url]: https://github.com/eclipse-tractusx/tractusx-identityhub/graphs/contributors

[stars-shield]: https://img.shields.io/github/stars/eclipse-tractusx/tractusx-identityhub.svg?style=for-the-badge

[stars-url]: https://github.com/eclipse-tractusx/tractusx-identityhub/stargazers

[license-shield]: https://img.shields.io/github/license/eclipse-tractusx/tractusx-identityhub.svg?style=for-the-badge

[license-url]: https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/LICENSE

[release-shield]: https://img.shields.io/github/v/release/eclipse-tractusx/tractusx-identityhub.svg?style=for-the-badge

[release-url]: https://github.com/eclipse-tractusx/tractusx-identityhub/releases
