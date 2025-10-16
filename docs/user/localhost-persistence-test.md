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
```

```shell
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

Append this content to end of file in `pvc-logging.yaml`

```yaml
    volumeName: logs-pv
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: logs-pv
spec:
  capacity:
    storage: {{ .Values.identityhub.logging.persistence.size | quote }}
  accessModes:
    - {{ .Values.identityhub.logging.persistence.accessMode | quote }}
  persistentVolumeReclaimPolicy: Retain
  {{- if .Values.identityhub.logging.persistence.storageClass }}
  storageClassName: {{ .Values.identityhub.logging.persistence.storageClass }}
  {{- end }}
  hostPath:
    path: /data/logs/
```

> [!NOTE]
> If you want to test the issuerservice, change the values from
> identityhub.logging to isssuerservice.logging

Lastly, follow the instructions from the [INSTALL.md](/INSTALL.md`) in order to deploy
in helm. 

## Verify Persistence

In order to verify that the logs are being persisted in localhost, access
to the minikube ssh and verify if a `.log` file has been generated in 
`/data/logs` folder.

# NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation