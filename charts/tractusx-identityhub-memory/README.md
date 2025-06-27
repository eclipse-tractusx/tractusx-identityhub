# tractusx-identityhub

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

A Helm chart for Tractus-X IdentityHub, a comprehensive DCP CredentialService solution

**Homepage:** <https://github.com/eclipse-tractusx/tractusx-identityhub/tree/main/charts/tractusx-identityhub>

# Configure the chart

Optionally provide the following configuration entries to your Tractus-X IdentityHub Helm chart, either by directly setting them (`--set`)
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
helm install my-release tractusx-identityhub/identityhub --version 0.1.0 \
     -f <path-to>/additional-values-file.yaml \
     --wait-for-jobs --timeout=120s --dependency-update
```

## Source Code

* <https://github.com/eclipse-tractusx/tractusx-identityhub/tree/main/charts/tractusx-identityhub>

## Prerequisites

- Kubernetes 1.29.8+
- Helm 3.14.0+

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
| identityhub.endpoints | object | `{"default":{"path":"/api","port":8080},"did":{"path":"/","port":8083},"identity":{"authKeyAlias":"sup3r$3cr3t","path":"/api/identity","port":8081},"presentation":{"path":"/api/presentation","port":8082}}` | endpoints of the control plane |
| identityhub.endpoints.default | object | `{"path":"/api","port":8080}` | default api for health checks, should not be added to any ingress |
| identityhub.endpoints.default.path | string | `"/api"` | path for incoming api calls |
| identityhub.endpoints.default.port | int | `8080` | port for incoming api calls |
| identityhub.endpoints.did | object | `{"path":"/","port":8083}` | DID service endpoint. DID documents can be resolved from here. |
| identityhub.endpoints.did.path | string | `"/"` | path for incoming api calls |
| identityhub.endpoints.did.port | int | `8083` | port for incoming api calls |
| identityhub.endpoints.identity | object | `{"authKeyAlias":"sup3r$3cr3t","path":"/api/identity","port":8081}` | management api, used by internal users, can be added to an ingress and must not be internet facing |
| identityhub.endpoints.identity.authKeyAlias | string | `"sup3r$3cr3t"` | authentication key, must be attached to each 'X-Api-Key' request header |
| identityhub.endpoints.identity.path | string | `"/api/identity"` | path for incoming api calls |
| identityhub.endpoints.identity.port | int | `8081` | port for incoming api calls |
| identityhub.endpoints.presentation | object | `{"path":"/api/presentation","port":8082}` | DCP Presentation API endpoint |
| identityhub.endpoints.presentation.path | string | `"/api/presentation"` | path for incoming api calls |
| identityhub.endpoints.presentation.port | int | `8082` | port for incoming api calls |
| identityhub.env | object | `{}` |  |
| identityhub.envConfigMapNames[0] | string | `"identityhub-config"` |  |
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
| identityhub.ingresses[0].endpoints | list | `["directory"]` | EDC endpoints exposed by this ingress resource |
| identityhub.ingresses[0].hostname | string | `"identityhub.presentation.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| identityhub.ingresses[0].tls | object | `{"enabled":false,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| identityhub.ingresses[0].tls.enabled | bool | `false` | Enables TLS on the ingress resource |
| identityhub.ingresses[0].tls.secretName | string | `""` | If present overwrites the default secret name |
| identityhub.ingresses[1].annotations | object | `{}` | Additional ingress annotations to add |
| identityhub.ingresses[1].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| identityhub.ingresses[1].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| identityhub.ingresses[1].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| identityhub.ingresses[1].enabled | bool | `false` |  |
| identityhub.ingresses[1].endpoints | list | `["management"]` | EDC endpoints exposed by this ingress resource |
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
| identityhub.logging | string | `".level=INFO\norg.eclipse.edc.level=INFO\nhandlers=java.util.logging.ConsoleHandler\njava.util.logging.ConsoleHandler.formatter=java.util.logging.SimpleFormatter\njava.util.logging.ConsoleHandler.level=ALL\njava.util.logging.SimpleFormatter.format=[%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] [%4$-7s] %5$s%6$s%n"` | configuration of the [Java Util Logging Facade](https://docs.oracle.com/javase/7/docs/technotes/guides/logging/overview.html) |
| identityhub.nodeSelector | object | `{}` |  |
| identityhub.podAnnotations | object | `{}` | additional annotations for the pod |
| identityhub.podLabels | object | `{}` | additional labels for the pod |
| identityhub.podSecurityContext | object | `{"fsGroup":10001,"runAsGroup":10001,"runAsUser":10001,"seccompProfile":{"type":"RuntimeDefault"}}` | The [pod security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod) defines privilege and access control settings for a Pod within the deployment |
| identityhub.podSecurityContext.fsGroup | int | `10001` | The owner for volumes and any files created within volumes will belong to this guid |
| identityhub.podSecurityContext.runAsGroup | int | `10001` | Processes within a pod will belong to this guid |
| identityhub.podSecurityContext.runAsUser | int | `10001` | Runs all processes within a pod with a special uid |
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
| identityhub.securityContext.runAsUser | int | `10001` | The container's process will run with the specified uid |
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
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.imagePullSecrets | list | `[]` | Existing image pull secret bound to the service account to use to [obtain the container image from private registries](https://kubernetes.io/docs/concepts/containers/images/#using-a-private-registry) |
| serviceAccount.name | string | `""` |  |
| tests | object | `{"hookDeletePolicy":"before-hook-creation,hook-succeeded"}` | Configurations for Helm tests |
| tests.hookDeletePolicy | string | `"before-hook-creation,hook-succeeded"` | Configure the hook-delete-policy for Helm tests |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
