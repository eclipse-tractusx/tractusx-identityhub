# Testing Localhost Logger Persistence

> [!WARNING]
> This test has been done and verified with minikube

This guide mounts and deploys de helm charts with the logger and
persistence enabled.

The persistence volume is a hostpath folder in the minikube virtual machine.

## Setup and Test

Access the minikube virtual machine via ssh and create the folder `/data/logs`
with the correct permissions and owners
```shell
minikube ssh
cd /data
sudo mkdir ./logs
sudo chown 10100:10100 ./logs
```

Enable de logging and persistence in `values.yaml`

```yaml
  logging:
    enabled: true
    persistence:
      enabled: true
```

Lastly, follow the instructions from the [INSTALL.md](/INSTALL.md) in order to deploy
in helm.

## Verify Persistence

In order to verify that the logs are being persisted in localhost, access
to the minikube ssh and verify if a `.log` file has been generated in 
`/data/logs` folder.

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/docs/user/localhost-persistence-test.md>