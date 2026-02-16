# Tractusx-identityhub

![Version: 0.1.1](https://img.shields.io/badge/Version-0.1.1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

A Helm chart for Tractus-X IdentityHub, that deploys the IdentityHub with postgresql and vault charts for persistance

**Homepage:** <https://github.com/eclipse-tractusx/tractusx-identityhub/tree/main/charts/tractusx-identityhub>

## TL;DR

```shell
helm repo add tractusx-dev https://eclipse-tractusx.github.io/charts/dev
helm install identityhub tractusx-dev/tractusx-identityhub
```

## Source Code

* <https://github.com/eclipse-tractusx/tractusx-identityhub/tree/main/charts/tractusx-identityhub>

## Prerequisites

- Kubernetes 1.29.8+
- Helm 3.14.0+
- PV provisioner support in the underlying infrastructure

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://github.com/CloudPirates-io/helm-charts| postgres(postgresql) | 0.11.0  |
| https://helm.releases.hashicorp.com | vault(vault) | 0.29.1  |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customCaCerts | object | `{}` | Add custom ca certificates to the truststore |
| customLabels | object | `{}` | To add some custom labels |
| fullnameOverride | string | `""` |  |
| identityhub.affinity | object | `{}` |  |
| identityhub.autoscaling.enabled | bool | `false` | Enables [horizontal pod autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) |
| identityhub.autoscaling.maxReplicas | int | `100` | Maximum replicas if resource consumption exceeds resource threshholds |
| identityhub.autoscaling.minReplicas | int | `1` | Minimal replicas if resource consumption falls below resource threshholds |
| identityhub.autoscaling.targetCPUUtilizationPercentage | int | `80` | targetAverageUtilization of cpu provided to a pod |
| identityhub.autoscaling.targetMemoryUtilizationPercentage | int | `80` | targetAverageUtilization of memory provided to a pod |
| identityhub.debug.enabled | bool | `false` |  |
| identityhub.debug.port | int | `1044` |  |
| identityhub.debug.suspendOnStart | bool | `false` |  |
| identityhub.endpoints | object | `{"accounts":{"authKeyAlias":"sup3r$3cr3t","path":"/api/accounts","port":8085},"credentials":{"path":"/api/credentials","port":8083},"default":{"path":"/api","port":8081},"did":{"path":"/","port":8084},"identity":{"authKeyAlias":"sup3r$3cr3t","path":"/api/identity","port":8082},"sts":{"path":"/api/sts","port":8087},"version":{"path":"/.well-known/api","port":8086}}` | endpoints of the control plane |
| identityhub.endpoints.accounts | object | `{"authKeyAlias":"sup3r$3cr3t","path":"/api/accounts","port":8085}` | STS Accounts API, used to manipulate STS accounts |
| identityhub.endpoints.credentials | object | `{"path":"/api/credentials","port":8083}` | DCP Presentation API endpoint |
| identityhub.endpoints.credentials.path | string | `"/api/credentials"` | path for incoming api calls |
| identityhub.endpoints.credentials.port | int | `8083` | port for incoming api calls |
| identityhub.endpoints.default | object | `{"path":"/api","port":8081}` | default api for health checks, should not be added to any ingress |
| identityhub.endpoints.default.path | string | `"/api"` | path for incoming api calls |
| identityhub.endpoints.default.port | int | `8081` | port for incoming api calls |
| identityhub.endpoints.did | object | `{"path":"/","port":8084}` | DID service endpoint. DID documents can be resolved from here. |
| identityhub.endpoints.did.path | string | `"/"` | path for incoming api calls |
| identityhub.endpoints.did.port | int | `8084` | port for incoming api calls |
| identityhub.endpoints.identity | object | `{"authKeyAlias":"sup3r$3cr3t","path":"/api/identity","port":8082}` | management api, used by internal users, can be added to an ingress and must not be internet facing |
| identityhub.endpoints.identity.authKeyAlias | string | `"sup3r$3cr3t"` | authentication key, must be attached to each 'X-Api-Key' request header |
| identityhub.endpoints.identity.path | string | `"/api/identity"` | path for incoming api calls |
| identityhub.endpoints.identity.port | int | `8082` | port for incoming api calls |
| identityhub.endpoints.sts | object | `{"path":"/api/sts","port":8087}` | STS Endpoint, used to obtain tokens |
| identityhub.endpoints.version | object | `{"path":"/.well-known/api","port":8086}` | Version API, used to obtain exact version information about all APIs at runtime |
| identityhub.env | object | `{}` |  |
| identityhub.envConfigMapNames[0] | string | `"identityhub-config"` |  |
| identityhub.envConfigMapNames[1] | string | `"identityhub-datasource-config"` |  |
| identityhub.envSecretNames | list | `[]` |  |
| identityhub.envValueFrom | object | `{}` |  |
| identityhub.image.pullPolicy | string | `"IfNotPresent"` | [Kubernetes image pull policy](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy) to use |
| identityhub.image.repository | string | `""` |  |
| identityhub.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion |
| identityhub.ingresses[0].annotations | object | `{}` | Additional ingress annotations to add |
| identityhub.ingresses[0].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| identityhub.ingresses[0].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| identityhub.ingresses[0].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| identityhub.ingresses[0].enabled | bool | `false` |  |
| identityhub.ingresses[0].endpoints | list | `["credentials","did","sts"]` | EDC endpoints exposed by this ingress resource |
| identityhub.ingresses[0].hostname | string | `"identityhub.presentation.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| identityhub.ingresses[0].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| identityhub.ingresses[0].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| identityhub.ingresses[0].tls.secretName | string | `""` | If present overwrites the default secret name |
| identityhub.ingresses[1].annotations | object | `{}` | Additional ingress annotations to add |
| identityhub.ingresses[1].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| identityhub.ingresses[1].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| identityhub.ingresses[1].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| identityhub.ingresses[1].enabled | bool | `false` |  |
| identityhub.ingresses[1].endpoints | list | `["identity","accounts","version"]` | EDC endpoints exposed by this ingress resource |
| identityhub.ingresses[1].hostname | string | `"identityhub.identity.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| identityhub.ingresses[1].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| identityhub.ingresses[1].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| identityhub.ingresses[1].tls.secretName | string | `""` | If present overwrites the default secret name |
| identityhub.initContainers | list | `[]` |  |
| identityhub.livenessProbe.enabled | bool | `true` | Whether to enable kubernetes [liveness-probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| identityhub.livenessProbe.failureThreshold | int | `6` | when a probe fails kubernetes will try 6 times before giving up |
| identityhub.livenessProbe.initialDelaySeconds | int | `5` | seconds to wait before performing the first liveness check |
| identityhub.livenessProbe.periodSeconds | int | `5` | this fields specifies that kubernetes should perform a liveness check every 5 seconds |
| identityhub.livenessProbe.successThreshold | int | `1` | number of consecutive successes for the probe to be considered successful after having failed |
| identityhub.livenessProbe.timeoutSeconds | int | `5` | number of seconds after which the probe times out |
| identityhub.logging.default | string | `".level=INFO\norg.eclipse.edc.level=INFO\nhandlers=java.util.logging.ConsoleHandler\njava.util.logging.ConsoleHandler.formatter=org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter\njava.util.logging.ConsoleHandler.level=ALL\norg.eclipse.tractusx.identityhub.monitor.ColorfulFormatter.format=%7$s[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$s] %5$s%6$s%n%8$s"` | default logging properties if logging is not enabled |
| identityhub.logging.enabled | bool | `true` | Enable logging to create .log files |
| identityhub.logging.formatters."org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter" | object | `{"format":"%7$s[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$s] %5$s%6$s%n%8$s"}` | configuration of custom colorful formatter |
| identityhub.logging.handlers | list | `["java.util.logging.ConsoleHandler","java.util.logging.FileHandler"]` | List of handlers to use in the logger |
| identityhub.logging.handlersConfig."java.util.logging.ConsoleHandler" | object | `{"formatter":"org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter","level":"FINE"}` | Console handler configuration |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".append | bool | `true` | Append logs to the file or create new file every deployment |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".count | int | `1` | Number of files to use in log file rotation |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".formatter | string | `"org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter"` | Formatter to use in handler, formatter must be set in identityhub.logging.formatters |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".level | string | `"FINE"` | Log level of handler |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".limit | int | `0` | Limit of bytes to write before log file rotation |
| identityhub.logging.handlersConfig."java.util.logging.FileHandler".pattern | string | `"/app/logs/identityhub.log"` | Path where the log is created, must be the same path as the logging.path values |
| identityhub.logging.level | string | `"INFO"` | root log level |
| identityhub.logging.logLevels | object | `{"org.eclipse.edc": "FINE"}` | package level control |
| identityhub.logging.path | string | `"/app/logs"` | path where the log resides, must be the same path as the fileHandler pattern |
| identityhub.logging.persistence.accessMode | string | `"ReadWriteOnce"` | Persistent volume access mode |
| identityhub.logging.persistence.enabled | bool | `false` | Enable .log files to persist in local machine |
| identityhub.logging.persistence.size | string | `"1Gi"` | Persistent volume size |
| identityhub.logging.persistence.storageClass | string | `"standard"` | Persistent volume claim storage name |
| identityhub.nodeSelector | object | `{}` |  |
| identityhub.podAnnotations | object | `{}` | additional annotations for the pod |
| identityhub.podLabels | object | `{}` | additional labels for the pod |
| identityhub.podSecurityContext | object | `{"fsGroup":10100,"runAsGroup":10100,"runAsUser":10100,"seccompProfile":{"type":"RuntimeDefault"}}` | The [pod security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod) defines privilege and access control settings for a Pod within the deployment |
| identityhub.podSecurityContext.fsGroup | int | `10100` | The owner for volumes and any files created within volumes will belong to this guid |
| identityhub.podSecurityContext.runAsGroup | int | `10100` | Processes within a pod will belong to this guid |
| identityhub.podSecurityContext.runAsUser | int | `10100` | Runs all processes within a pod with a special uid |
| identityhub.podSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` | Restrict a Container's Syscalls with seccomp |
| identityhub.readinessProbe.enabled | bool | `true` | Whether to enable kubernetes [readiness-probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| identityhub.readinessProbe.failureThreshold | int | `6` | when a probe fails kubernetes will try 6 times before giving up |
| identityhub.readinessProbe.initialDelaySeconds | int | `5` | seconds to wait before performing the first readiness check |
| identityhub.readinessProbe.periodSeconds | int | `5` | this fields specifies that kubernetes should perform a readiness check every 5 seconds |
| identityhub.readinessProbe.successThreshold | int | `1` | number of consecutive successes for the probe to be considered successful after having failed |
| identityhub.readinessProbe.timeoutSeconds | int | `5` | number of seconds after which the probe times out |
| identityhub.replicaCount | int | `1` |  |
| identityhub.resources | object | `{"limits":{"cpu":1.5,"memory":"512Mi"},"requests":{"cpu":"500m","memory":"128Mi"}}` | [resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) for the container |
| identityhub.securityContext.allowPrivilegeEscalation | bool | `false` | Controls [Privilege Escalation](https://kubernetes.io/docs/concepts/security/pod-security-policy/#privilege-escalation) enabling setuid binaries changing the effective user ID |
| identityhub.securityContext.capabilities.add | list | `[]` | Specifies which capabilities to add to issue specialized syscalls |
| identityhub.securityContext.capabilities.drop | list | `["ALL"]` | Specifies which capabilities to drop to reduce syscall attack surface |
| identityhub.securityContext.readOnlyRootFilesystem | bool | `true` | Whether the root filesystem is mounted in read-only mode |
| identityhub.securityContext.runAsNonRoot | bool | `true` | Requires the container to run without root privileges |
| identityhub.securityContext.runAsUser | int | `10100` | The container's process will run with the specified uid |
| identityhub.service.annotations | object | `{}` |  |
| identityhub.service.type | string | `"ClusterIP"` | [Service type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to expose the running application on a set of Pods as a network service. |
| identityhub.tolerations | list | `[]` |  |
| identityhub.url.protocol | string | `""` | Explicitly declared url for reaching the dsp api (e.g. if ingresses not used) |
| identityhub.url.public | string | `""` |  |
| identityhub.url.readiness | string | `""` |  |
| identityhub.useSVE | bool | `false` |  |
| identityhub.volumeMounts | list | `[]` | declare where to mount [volumes](https://kubernetes.io/docs/concepts/storage/volumes/) into the container |
| identityhub.volumes | list | `[]` | [volume](https://kubernetes.io/docs/concepts/storage/volumes/) directories |
| imagePullSecrets | list | `[]` | Existing image pull secret to use to [obtain the container image from private registries](https://kubernetes.io/docs/concepts/containers/images/#using-a-private-registry) |
| install.postgresql | bool | `true` |  |
| install.vault | bool | `true` |  |
| nameOverride | string | `""` |  |
| postgresql.auth.database | string | `"ih"` |  |
| postgresql.auth.password | string | `"password"` |  |
| postgresql.auth.username | string | `"user"` |  |
| postgresql.image.repository | string | `"bitnamilegacy/postgresql"` | workaround to use bitnamilegacy chart for version 12.12.x till committers align on new postgresql charts |
| postgresql.image.tag | string | `"15.4.0-debian-11-r45"` | workaround to use bitnamilegacy chart for version 12.12.x till committers align on new postgresql charts |
| postgresql.jdbcUrl | string | `"jdbc:postgresql://{{ .Release.Name }}-postgresql:5432/ih"` |  |
| postgresql.primary.persistence.enabled | bool | `false` |  |
| postgresql.primary.resources.limits.cpu | int | `1` |  |
| postgresql.primary.resources.limits.memory | string | `"1Gi"` |  |
| postgresql.primary.resources.requests.cpu | string | `"250m"` |  |
| postgresql.primary.resources.requests.memory | string | `"256Mi"` |  |
| postgresql.readReplicas.persistence.enabled | bool | `false` |  |
| postgresql.readReplicas.resources.limits.cpu | string | `"500Mi"` |  |
| postgresql.readReplicas.resources.limits.memory | string | `"1Gi"` |  |
| postgresql.readReplicas.resources.requests.cpu | string | `"250m"` |  |
| postgresql.readReplicas.resources.requests.memory | string | `"256Mi"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.imagePullSecrets | list | `[]` | Existing image pull secret bound to the service account to use to [obtain the container image from private registries](https://kubernetes.io/docs/concepts/containers/images/#using-a-private-registry) |
| serviceAccount.name | string | `""` |  |
| tests | object | `{"hookDeletePolicy":"before-hook-creation,hook-succeeded"}` | Configurations for Helm tests |
| tests.hookDeletePolicy | string | `"before-hook-creation,hook-succeeded"` | Configure the hook-delete-policy for Helm tests |
| vault.hashicorp.healthCheck.enabled | bool | `true` |  |
| vault.hashicorp.healthCheck.standbyOk | bool | `true` |  |
| vault.hashicorp.paths.health | string | `"/v1/sys/health"` |  |
| vault.hashicorp.paths.secret | string | `"/v1/secret"` |  |
| vault.hashicorp.timeout | int | `30` |  |
| vault.hashicorp.token | string | `"root"` |  |
| vault.hashicorp.url | string | `"http://{{ .Release.Name }}-vault:8200"` |  |
| vault.injector.enabled | bool | `false` |  |
| vault.server.dev.devRootToken | string | `"root"` |  |
| vault.server.dev.enabled | bool | `true` |  |
| vault.server.postStart | string | `nil` |  |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
