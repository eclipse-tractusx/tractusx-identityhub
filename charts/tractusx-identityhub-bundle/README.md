# tractusx-identityhub-bundle

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.16.0](https://img.shields.io/badge/AppVersion-1.16.0-informational?style=flat-square)

A Helm chart for Kubernetes

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| file://../tractusx-identityhub | backend(tractusx-identityhub) | v0.3.2 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `100` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| backend.enabled | bool | `true` |  |
| backend.fullnameOverride | string | `""` |  |
| backend.identityhub.didweb | object | `{"https":false}` | Whether web DIDs should be interpreted as HTTPS or HTTP |
| backend.identityhub.iatp | object | `{"sts":{"oauth":{"client":{"enabled":true,"id":"did:web:identityhub.presentation.local","secret":"testme","secret_alias":"sts-secret","x_api_key":"ZGlkOndlYjppZGVudGl0eWh1Yi5wcmVzZW50YXRpb24ubG9jYWw=.randomChars"}}}}` | Initial participant context configuration |
| backend.identityhub.iatp.sts.oauth.client.enabled | bool | `true` | Enable participant context client configuration |
| backend.identityhub.iatp.sts.oauth.client.id | string | `"did:web:identityhub.presentation.local"` | Client ID // Did of the initial participant |
| backend.identityhub.iatp.sts.oauth.client.secret | string | `"testme"` | The client secret that is stored in the vault for requesting OAuth2 access token for Presentation API access |
| backend.identityhub.iatp.sts.oauth.client.secret_alias | string | `"sts-secret"` | Alias under which the client secret is stored in the vault |
| backend.identityhub.iatp.sts.oauth.client.x_api_key | string | `"ZGlkOndlYjppZGVudGl0eWh1Yi5wcmVzZW50YXRpb24ubG9jYWw=.randomChars"` | The x-api-key that is stored in the vault for the initial participant |
| backend.identityhub.image.pullPolicy | string | `"IfNotPresent"` | [Kubernetes image pull policy](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy) to use |
| backend.identityhub.image.repository | string | `"tractusx/identityhub"` |  |
| backend.identityhub.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion |
| backend.identityhub.ingresses[0].annotations | object | `{}` | Additional ingress annotations to add |
| backend.identityhub.ingresses[0].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| backend.identityhub.ingresses[0].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| backend.identityhub.ingresses[0].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| backend.identityhub.ingresses[0].enabled | bool | `true` |  |
| backend.identityhub.ingresses[0].endpoints | list | `["credentials","did","sts"]` | EDC endpoints exposed by this ingress resource |
| backend.identityhub.ingresses[0].hostname | string | `"identityhub.presentation.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| backend.identityhub.ingresses[0].tls | object | `{"enabled":true,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| backend.identityhub.ingresses[0].tls.enabled | bool | `true` | Enables TLS on the ingress resource |
| backend.identityhub.ingresses[0].tls.secretName | string | `""` | If present overwrites the default secret name |
| backend.identityhub.ingresses[1].annotations | object | `{}` | Additional ingress annotations to add |
| backend.identityhub.ingresses[1].certManager.clusterIssuer | string | `""` | If preset enables certificate generation via cert-manager cluster-wide issuer |
| backend.identityhub.ingresses[1].certManager.issuer | string | `""` | If preset enables certificate generation via cert-manager namespace scoped issuer |
| backend.identityhub.ingresses[1].className | string | `""` | Defines the [ingress class](https://kubernetes.io/docs/concepts/services-networking/ingress/#ingress-class)  to use |
| backend.identityhub.ingresses[1].enabled | bool | `false` |  |
| backend.identityhub.ingresses[1].endpoints | list | `["identity","accounts","version"]` | EDC endpoints exposed by this ingress resource |
| backend.identityhub.ingresses[1].hostname | string | `"identityhub.identity.local"` | The hostname to be used to precisely map incoming traffic onto the underlying network service |
| backend.identityhub.ingresses[1].tls | object | `{"enabled":true,"secretName":""}` | TLS [tls class](https://kubernetes.io/docs/concepts/services-networking/ingress/#tls) applied to the ingress resource |
| backend.identityhub.ingresses[1].tls.enabled | bool | `true` | Enables TLS on the ingress resource |
| backend.identityhub.ingresses[1].tls.secretName | string | `""` | If present overwrites the default secret name |
| backend.identityhub.volumeMounts | list | `[]` | declare where to mount [volumes](https://kubernetes.io/docs/concepts/storage/volumes/) into the container |
| backend.identityhub.volumes | list | `[]` | [volume](https://kubernetes.io/docs/concepts/storage/volumes/) directories |
| backend.nameOverride | string | `"identityhub-backend"` |  |
| frontend.enabled | bool | `true` |  |
| frontend.fullnameOverride | string | `""` |  |
| frontend.image.pullPolicy | string | `"IfNotPresent"` | [Kubernetes image pull policy](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy) to use |
| frontend.image.repository | string | `"tractusx/identityhub-frontend"` |  |
| frontend.image.tag | string | `""` | Overrides the image tag whose default is the chart appVersion |
| frontend.imagePullSecrets | list | `[]` |  |
| frontend.ingress.annotations | object | `{}` |  |
| frontend.ingress.className | string | `"nginx"` |  |
| frontend.ingress.enabled | bool | `true` |  |
| frontend.ingress.hosts[0].host | string | `"identityhub-frontend.local"` |  |
| frontend.ingress.hosts[0].paths[0].path | string | `"/"` |  |
| frontend.ingress.hosts[0].paths[0].pathType | string | `"ImplementationSpecific"` |  |
| frontend.ingress.tls[0].hosts[0] | string | `"identityhub-frontend.local"` |  |
| frontend.ingress.tls[0].secretName | string | `"idhub-frontend-tls"` |  |
| frontend.livenessProbe.httpGet.path | string | `"/"` |  |
| frontend.livenessProbe.httpGet.port | string | `"http"` |  |
| frontend.nameOverride | string | `"identityhub-frontend"` |  |
| frontend.podSecurityContext | object | `{}` |  |
| frontend.readinessProbe.httpGet.path | string | `"/"` |  |
| frontend.readinessProbe.httpGet.port | string | `"http"` |  |
| frontend.resources.limits.cpu | string | `"500m"` |  |
| frontend.resources.limits.memory | string | `"128Mi"` |  |
| frontend.resources.requests.cpu | string | `"2500m"` |  |
| frontend.resources.requests.memory | string | `"128Mi"` |  |
| frontend.securityContext | object | `{}` |  |
| frontend.service.port | int | `8080` |  |
| frontend.service.type | string | `"ClusterIP"` |  |
| frontend.volumeMounts | list | `[]` |  |
| frontend.volumes | list | `[]` |  |
| fullnameOverride | string | `""` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podLabels | object | `{}` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.automount | bool | `true` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
| tolerations | list | `[]` |  |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
