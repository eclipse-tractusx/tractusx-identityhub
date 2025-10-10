# tractusx-issuerservice-memory

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

A Helm chart for Tractus-X IssuerService-Memory, a comprehensive DCP CredentialService solution

**Homepage:** <https://github.com/eclipse-tractusx/tractusx-issuerservice-memory/tree/main/charts/tractusx-issuerservice-memory>

# Configure the chart

Optionally provide the following configuration entries to your Tractus-X IssuerService-Memory Helm chart, either by directly setting them (`--set`)
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

* <https://github.com/eclipse-tractusx/tractusx-issuerservice-memory/tree/main/charts/tractusx-issuerservice-memory>

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
| issuerservice.endpoints | object | `{"default":{"path":"/api","port":8081},"did":{"path":"/","port":8083},"issuance":{"path":"/api/issuance","port":8082},"version":{"path":"/.well-known/api","port":8086}}` | endpoints of the control plane |
| issuerservice.endpoints.default | object | `{"path":"/api","port":8081}` | default api for health checks, should not be added to any ingress |
| issuerservice.endpoints.default.path | string | `"/api"` | path for incoming api calls |
| issuerservice.endpoints.default.port | int | `8081` | port for incoming api calls |
| issuerservice.endpoints.did | object | `{"path":"/","port":8083}` | DID API, used to resolve the issuer's DID document. Must be internet-facing |
| issuerservice.endpoints.issuance | object | `{"path":"/api/issuance","port":8082}` | DCP Issuance API. Must be internet-facint. |
| issuerservice.endpoints.version | object | `{"path":"/.well-known/api","port":8086}` | Version API, used to obtain exact version information about all APIs at runtime. Should not be internet-facing |
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
| issuerservice.ingresses[0].endpoints | list | `["directory"]` | EDC endpoints exposed by this ingress resource |
| issuerservice.ingresses[0].hostname | string | `"issuerservice.presentation.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| issuerservice.ingresses[0].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| issuerservice.ingresses[0].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| issuerservice.ingresses[0].tls.secretName | string | `""` | If present overwrites the default secret name |
| issuerservice.ingresses[1].annotations | object | `{}` | Additional ingress annotations to add |
| issuerservice.ingresses[1].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| issuerservice.ingresses[1].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| issuerservice.ingresses[1].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| issuerservice.ingresses[1].enabled | bool | `false` |  |
| issuerservice.ingresses[1].endpoints | list | `["management"]` | EDC endpoints exposed by this ingress resource |
| issuerservice.ingresses[1].hostname | string | `"issuerservice.identity.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| issuerservice.ingresses[1].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| issuerservice.ingresses[1].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| issuerservice.ingresses[1].tls.secretName | string | `""` | If present overwrites the default secret name |
| issuerservice.initContainers | list | `[]` |  |
| issuerservice.livenessProbe.enabled | bool | `true` | Whether to enable kubernetes [liveness-probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| issuerservice.livenessProbe.failureThreshold | int | `6` | when a probe fails kubernetes will try 6 times before giving up |
| issuerservice.livenessProbe.initialDelaySeconds | int | `5` | seconds to wait before performing the first liveness check |
| issuerservice.livenessProbe.periodSeconds | int | `5` | this fields specifies that kubernetes should perform a liveness check every 5 seconds |
| issuerservice.livenessProbe.successThreshold | int | `1` | number of consecutive successes for the probe to be considered successful after having failed |
| issuerservice.livenessProbe.timeoutSeconds | int | `5` | number of seconds after which the probe times out |
| issuerservice.logging.enabled | bool | `true` | Enables logging custom configuration and files |
| issuerservice.logging.persistence.enabled | bool | `false` | Enables persistence of `.log` files |
| issuerservice.logging.persistence.accessMode | string | `ReadWriteOnce` | Access mode for the PersistentVolumeClaim |
| issuerservice.logging.persistence.size | string | `1Gi` | Size of the PersistentVolumeClaim |
| issuerservice.logging.persistence.storageClass | string | `test` | Storage class for the PersistentVolumeClaim |
| issuerservice.logging.properties | string | `logging.properties` | Filename of the logging properties file |
| issuerservice.logging.file | string | `issuerservice.log` | Name of the log file |
| issuerservice.logging.path | string | `/app/logs` | Path where the log files will be stored |
| issuerservice.logging.default | string | `.level=INFO  org.eclipse.edc.level=INFO  handlers=java.util.logging.ConsoleHandler  java.util.logging.ConsoleHandler.formatter=org.eclipse.tractusx.issuerservice.monitor.ColorfulFormatter  java.util.logging.ConsoleHandler.level=ALL  org.eclipse.tractusx.issuerservice.monitor.ColorfulFormatter.format=%7$s[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$s] %5$s%6$s%n%8$s` | Default logging configuration of the [Java Util Logging Facade](https://docs.oracle.com/javase/7/docs/technotes/guides/logging/overview.html) |
| issuerservice.nodeSelector | object | `{}` |  |
| issuerservice.podAnnotations | object | `{}` | additional annotations for the pod |
| issuerservice.podLabels | object | `{}` | additional labels for the pod |
| issuerservice.podSecurityContext | object | `{"fsGroup":10001,"runAsGroup":10001,"runAsUser":10001,"seccompProfile":{"type":"RuntimeDefault"}}` | The [pod security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod) defines privilege and access control settings for a Pod within the deployment |
| issuerservice.podSecurityContext.fsGroup | int | `10001` | The owner for volumes and any files created within volumes will belong to this guid |
| issuerservice.podSecurityContext.runAsGroup | int | `10001` | Processes within a pod will belong to this guid |
| issuerservice.podSecurityContext.runAsUser | int | `10001` | Runs all processes within a pod with a special uid |
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
| issuerservice.securityContext.runAsUser | int | `10001` | The container's process will run with the specified uid |
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
| postgresql.auth.database | string | `"ih"` |  |
| postgresql.auth.password | string | `"password"` |  |
| postgresql.auth.username | string | `"user"` |  |
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
