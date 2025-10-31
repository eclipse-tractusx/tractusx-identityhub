# tractusx-issuerservice

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

A Helm chart for Tractus-X IssuerService, a comprehensive DCP CredentialService solution

**Homepage:** <https://github.com/eclipse-tractusx/tractusx-issuerservice/tree/main/charts/tractusx-issuerservice>

# Configure the chart

Optionally provide the following configuration entries to your Tractus-X IssuerService Helm chart, either by directly setting them (`--set`)
or by supplying an additional yaml file:
- `server.endpoints.default.[port|path]`: the port and base path for the Observability API. This API is **not** supposed to be reachable
   via the internet!
- `server.endpoints.identity.[port|path]`: the port and base path for the IdentityAPI API. This API is **not** supposed to be reachable
   via the internet!
- `server.endpoints.did.[port|path]`: the port and base path for the DID Document resolution. This API is supposed to be internet-facing.
- `server.endpoints.presentation.[port|path]`: the port and base path for the DCP Presentation API. This API is supposed to be internet-facing.

### Launching the application

Simply execute these commands on a shell:

```shell
helm repo add tractusx https://eclipse-tractusx.github.io/charts/dev
helm install my-release tractusx-issuerservice/issuerservice --version 0.1.0 \
     -f <path-to>/additional-values-file.yaml \
     --wait-for-jobs --timeout=120s --dependency-update
```

## Source Code

* <https://github.com/eclipse-tractusx/tractusx-issuerservice/tree/main/charts/tractusx-issuerservice>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://charts.bitnami.com/bitnami | postgresql(postgresql) | 16.3.5 |
| https://helm.releases.hashicorp.com | vault(vault) | 0.29.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customCaCerts | object | `{}` | Add custom ca certificates to the truststore |
| customLabels | object | `{}` | To add some custom labels |
| fullnameOverride | string | `""` |  |
| imagePullSecrets | list | `[]` | Existing image pull secret to use to [obtain the container image from private registries](https://kubernetes.io/docs/concepts/containers/images/#using-a-private-registry) |
| install.postgresql | bool | `true` |  |
| install.vault | bool | `true` |  |
| issuerservice.affinity | object | `{}` |  |
| issuerservice.autoscaling.enabled | bool | `false` | Enables [horizontal pod autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) |
| issuerservice.autoscaling.maxReplicas | int | `100` | Maximum replicas if resource consumption exceeds resource threshholds |
| issuerservice.autoscaling.minReplicas | int | `1` | Minimal replicas if resource consumption falls below resource threshholds |
| issuerservice.autoscaling.targetCPUUtilizationPercentage | int | `80` | targetAverageUtilization of cpu provided to a pod |
| issuerservice.autoscaling.targetMemoryUtilizationPercentage | int | `80` | targetAverageUtilization of memory provided to a pod |
| issuerservice.debug.enabled | bool | `false` |  |
| issuerservice.debug.port | int | `1044` |  |
| issuerservice.debug.suspendOnStart | bool | `false` |  |
| issuerservice.didweb | object | `{"https":false}` | Whether web DIDs should be interpreted as HTTPS or HTTP |
| issuerservice.endpoints | object | `{"default":{"path":"/api","port":8081},"did":{"path":"/","port":8083},"identity":{"path":"/api/identity","port":8087},"issuance":{"path":"/api/issuance","port":8082},"issueradmin":{"path":"/api/admin","port":8086},"sts":{"path":"/api/sts","port":8085},"version":{"path":"/.well-known/api","port":8084}}` | endpoints of the control plane |
| issuerservice.endpoints.default | object | `{"path":"/api","port":8081}` | default api for health checks, should not be added to any ingress |
| issuerservice.endpoints.default.path | string | `"/api"` | path for incoming api calls |
| issuerservice.endpoints.default.port | int | `8081` | port for incoming api calls |
| issuerservice.endpoints.did | object | `{"path":"/","port":8083}` | DID API, used to resolve the issuer's DID document. Must be internet-facing |
| issuerservice.endpoints.identity | object | `{"path":"/api/identity","port":8087}` | Identity API, used to manage certain identity aspects such as DID documents, key pairs etc. Should not be internet-facing |
| issuerservice.endpoints.issuance | object | `{"path":"/api/issuance","port":8082}` | DCP Issuance API. Must be internet-facing. |
| issuerservice.endpoints.issueradmin | object | `{"path":"/api/admin","port":8086}` | Issuer Admin API to manage data of the IssuerService. Should not be internet-facing |
| issuerservice.endpoints.sts | object | `{"path":"/api/sts","port":8085}` | STS Token API, for the IssuerService to create Self-Issued ID tokens |
| issuerservice.endpoints.version | object | `{"path":"/.well-known/api","port":8084}` | Version API, used to obtain exact version information about all APIs at runtime. Should not be internet-facing |
| issuerservice.env | object | `{}` |  |
| issuerservice.envConfigMapNames[0] | string | `"issuerservice-config"` |  |
| issuerservice.envConfigMapNames[1] | string | `"issuerservice-datasource-config"` |  |
| issuerservice.envSecretNames | list | `[]` |  |
| issuerservice.envValueFrom | object | `{}` |  |
| issuerservice.image.pullPolicy | string | `"IfNotPresent"` | [Kubernetes image pull policy](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy) to use |
| issuerservice.image.repository | string | `""` |  |
| issuerservice.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion |
| issuerservice.ingresses[0].annotations | object | `{}` | Additional ingress annotations to add |
| issuerservice.ingresses[0].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| issuerservice.ingresses[0].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| issuerservice.ingresses[0].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| issuerservice.ingresses[0].enabled | bool | `false` |  |
| issuerservice.ingresses[0].endpoints | list | `["issuance"]` | EDC endpoints exposed by this ingress resource |
| issuerservice.ingresses[0].hostname | string | `"issuerservice.issuance.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| issuerservice.ingresses[0].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| issuerservice.ingresses[0].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| issuerservice.ingresses[0].tls.secretName | string | `""` | If present overwrites the default secret name |
| issuerservice.ingresses[1].annotations | object | `{}` | Additional ingress annotations to add |
| issuerservice.ingresses[1].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| issuerservice.ingresses[1].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| issuerservice.ingresses[1].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| issuerservice.ingresses[1].enabled | bool | `false` |  |
| issuerservice.ingresses[1].endpoints | list | `["did"]` | EDC endpoints exposed by this ingress resource |
| issuerservice.ingresses[1].hostname | string | `"issuerservice.did.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| issuerservice.ingresses[1].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| issuerservice.ingresses[1].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| issuerservice.ingresses[1].tls.secretName | string | `""` | If present overwrites the default secret name |
| issuerservice.initContainers | list | `[]` |  |
| issuerservice.jtivalidation | bool | `false` | Whether Self-Issued ID tokens are protected with JTI claims (=nonce) |
| issuerservice.livenessProbe.enabled | bool | `true` | Whether to enable kubernetes [liveness-probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| issuerservice.livenessProbe.failureThreshold | int | `6` | when a probe fails kubernetes will try 6 times before giving up |
| issuerservice.livenessProbe.initialDelaySeconds | int | `5` | seconds to wait before performing the first liveness check |
| issuerservice.livenessProbe.periodSeconds | int | `5` | this fields specifies that kubernetes should perform a liveness check every 5 seconds |
| issuerservice.livenessProbe.successThreshold | int | `1` | number of consecutive successes for the probe to be considered successful after having failed |
| issuerservice.livenessProbe.timeoutSeconds | int | `5` | number of seconds after which the probe times out |
| issuerservice.logging.default | string | `".level=INFO\norg.eclipse.edc.level=INFO\nhandlers=java.util.logging.ConsoleHandler\njava.util.logging.ConsoleHandler.formatter=org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter\njava.util.logging.ConsoleHandler.level=ALL\norg.eclipse.tractusx.identityhub.monitor.ColorfulFormatter.format=%7$s[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$s] %5$s%6$s%n%8$s"` | default logging properties if logging is not enabled |
| issuerservice.logging.enabled | bool | `true` | Enable logging to create .log files |
| issuerservice.logging.formatters."org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter" | object | `{"format":"%7$s[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$s] %5$s%6$s%n%8$s"}` | configuration of custom colorful formatter |
| issuerservice.logging.handlers | list | `["java.util.logging.ConsoleHandler","java.util.logging.FileHandler"]` | List of handlers to use in the logger |
| issuerservice.logging.handlersConfig."java.util.logging.ConsoleHandler" | object | `{"formatter":"org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter","level":"FINE"}` | Console handler configuration |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".append | bool | `true` | Append logs to the file or create new file every deployment |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".count | int | `1` | Number of files to use in log file rotation |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".formatter | string | `"org.eclipse.tractusx.identityhub.monitor.ColorfulFormatter"` | Formatter to use in handler, formatter must be set in identityhub.logging.formatters |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".level | string | `"FINE"` | Log level of handler |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".limit | int | `0` | Limit of bytes to write before log file rotation |
| issuerservice.logging.handlersConfig."java.util.logging.FileHandler".pattern | string | `"/app/logs/identityhub.log"` | Path where the log is created, must be the same path as the logging.path values |
| issuerservice.logging.level | string | `"INFO"` | root log level |
| issuerservice.logging.logLevels | object | `{"org.eclipse.edc": "FINE"}` | package level control |
| issuerservice.logging.path | string | `"/app/logs"` | path where the log resides, must be the same path as the fileHandler pattern |
| issuerservice.logging.persistence.accessMode | string | `"ReadWriteOnce"` | Persistent volume access mode |
| issuerservice.logging.persistence.enabled | bool | `false` | Enable .log files to persist in local machine |
| issuerservice.logging.persistence.size | string | `"1Gi"` | Persistent volume size |
| issuerservice.logging.persistence.storageClass | string | `"standard"` | Persistent volume claim storage name |
| issuerservice.nodeSelector | object | `{}` |  |
| issuerservice.podAnnotations | object | `{}` | additional annotations for the pod |
| issuerservice.podLabels | object | `{}` | additional labels for the pod |
| issuerservice.podSecurityContext | object | `{"fsGroup":10100,"runAsGroup":10100,"runAsUser":10100,"seccompProfile":{"type":"RuntimeDefault"}}` | The [pod security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod) defines privilege and access control settings for a Pod within the deployment |
| issuerservice.podSecurityContext.fsGroup | int | `10100` | The owner for volumes and any files created within volumes will belong to this guid |
| issuerservice.podSecurityContext.runAsGroup | int | `10100` | Processes within a pod will belong to this guid |
| issuerservice.podSecurityContext.runAsUser | int | `10100` | Runs all processes within a pod with a special uid |
| issuerservice.podSecurityContext.seccompProfile.type | string | `"RuntimeDefault"` | Restrict a Container's Syscalls with seccomp |
| issuerservice.readinessProbe.enabled | bool | `true` | Whether to enable kubernetes [readiness-probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| issuerservice.readinessProbe.failureThreshold | int | `6` | when a probe fails kubernetes will try 6 times before giving up |
| issuerservice.readinessProbe.initialDelaySeconds | int | `5` | seconds to wait before performing the first readiness check |
| issuerservice.readinessProbe.periodSeconds | int | `5` | this fields specifies that kubernetes should perform a readiness check every 5 seconds |
| issuerservice.readinessProbe.successThreshold | int | `1` | number of consecutive successes for the probe to be considered successful after having failed |
| issuerservice.readinessProbe.timeoutSeconds | int | `5` | number of seconds after which the probe times out |
| issuerservice.replicaCount | int | `1` |  |
| issuerservice.resources | object | `{"limits":{"cpu":1.5,"memory":"512Mi"},"requests":{"cpu":"500m","memory":"128Mi"}}` | [resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) for the container |
| issuerservice.securityContext.allowPrivilegeEscalation | bool | `false` | Controls [Privilege Escalation](https://kubernetes.io/docs/concepts/security/pod-security-policy/#privilege-escalation) enabling setuid binaries changing the effective user ID |
| issuerservice.securityContext.capabilities.add | list | `[]` | Specifies which capabilities to add to issue specialized syscalls |
| issuerservice.securityContext.capabilities.drop | list | `["ALL"]` | Specifies which capabilities to drop to reduce syscall attack surface |
| issuerservice.securityContext.readOnlyRootFilesystem | bool | `true` | Whether the root filesystem is mounted in read-only mode |
| issuerservice.securityContext.runAsNonRoot | bool | `true` | Requires the container to run without root privileges |
| issuerservice.securityContext.runAsUser | int | `10100` | The container's process will run with the specified uid |
| issuerservice.service.annotations | object | `{}` |  |
| issuerservice.service.type | string | `"ClusterIP"` | [Service type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to expose the running application on a set of Pods as a network service. |
| issuerservice.tolerations | list | `[]` |  |
| issuerservice.url.protocol | string | `""` | Explicitly declared url for reaching the dsp api (e.g. if ingresses not used) |
| issuerservice.url.public | string | `""` |  |
| issuerservice.url.readiness | string | `""` |  |
| issuerservice.useSVE | bool | `false` |  |
| issuerservice.volumeMounts | list | `[]` | declare where to mount [volumes](https://kubernetes.io/docs/concepts/storage/volumes/) into the container |
| issuerservice.volumes | list | `[]` | [volume](https://kubernetes.io/docs/concepts/storage/volumes/) directories |
| nameOverride | string | `""` |  |
| postgresql.auth.database | string | `"issuer"` |  |
| postgresql.auth.password | string | `"password"` |  |
| postgresql.auth.username | string | `"user"` |  |
| postgresql.image.repository | string | `"bitnamilegacy/postgresql"` | workaround to use bitnamilegacy chart for version 12.12.x till committers align on new postgresql charts |
| postgresql.image.tag | string | `"15.4.0-debian-11-r45"` | workaround to use bitnamilegacy chart for version 12.12.x till committers align on new postgresql charts |
| postgresql.jdbcUrl | string | `"jdbc:postgresql://{{ .Release.Name }}-postgresql:5432/issuer"` |  |
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
| statuslist.signing_key.alias | string | `"default"` |  |
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
