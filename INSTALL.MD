# Deploying identityhub-memory in localhost

> [!NOTE]
> This guide has been tested with Linux OS distribution,

> [!WARNING]
> As of now, this guide ensures the deployment of the application but it does not ensure the correct configuration of the deployment.
> The documentation is being worked on to be able to understand and catch all possible configurations for a proper application launch in localhost.

This section shows a step by step process in order to successfully deploy identityhub-memory with a helm chart using a locally built docker image.
The steps will go from how to install the required tools to deploy the final helm to being able to deploy the identityhub-memory module with java, docker or helm commands.

## Prerequisites

This section describes the tools necessary to deploy the final helm chart and the versions that have been tested for the localhost deployment.

- [Docker](https://docs.docker.com/engine/install/ubuntu/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [Helm](https://helm.sh/docs/intro/install/)

## Launching the identityhub-memory with helm in localhost

This section prepares and builds the application directly from localhost with no use of Docker Hub to pull images from the cloud.
That means we generate the artifact, build the docker image and load it into kubernetes and deploy with helm charts.

### Build the Jar File
You can generate the artifact with the following command.

```shell
./gradlew clean build
```

### Create Docker Image

Build the docker image

```shell
# Path: tractusx-identityhub/
docker build runtimes/identityhub-memory/ -t identityhub-memory:test -f runtimes/identityhub-memory/Dockerfile
```

Or build the image going to the runtime/identityhub-memory module
```shell
# Path: tractusx-identityhub/runtime/identityhub-memory/
docker build . -t identityhub-memory:test
```

### Load Docker Image into Minikube
```shell
minikube image load identityhub-memory:test
```

### Deploy Identityhub-memory with Helm Charts

```shell
# Path: tractusx-identityhub/
helm install identityhub-memory charts/tractusx-identityhub-memory/ \
    --set "identityhub.endpoints.identity.authKey=password" \
    --set "identityhub.securityContext.readOnlyRootFilesystem=false" \
    --set "fullnameOverride=identityhub" \
    --set "identityhub.image.pullPolicy=Never" \
    --set "identityhub.image.tag=test" \
    --set "identityhub.image.repository=identityhub-memory" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update
```
For helm chart options and configuration, see [Helm chart documentation](https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/charts/tractusx-identityhub-memory/README.md)

## Alternative ways to deploy identityhub-memory in localhost

In case you don't want to deploy the helm chart, here are other ways to deploy the application.

### Java application

```shell
java -Dweb.http.credentials.port=10001 \
     -Dweb.http.credentials.path="/api/credentials" \
     -Dweb.http.port=8180 \
     -Dweb.http.path="/api" \
     -Dweb.http.did.port=8181 \
     -Dweb.http.did.path="/api/did" \
     -Dweb.http.identity.port=8182 \
     -Dweb.http.identity.path="/api/identity" \
     -Dweb.http.sts.port=8183 \
     -Dweb.http.sts.path="/api/sts" \
     -Dweb.http.issuance.port=8184 \
     -Dweb.http.issuance.path="/api/issuance" \
     -Dweb.http.issueradmin.port=8185 \
     -Dweb.http.issueradmin.path="/api/issueradmin" \
     -Dweb.http.statuslist.port=9999 \
     -Dweb.http.statuslist.path="/statuslist" \
     -jar runtimes/identityhub-memory/build/libs/identityhub-memory.jar
```

### Run docker image

```shell
docker run -d --rm --name identityhub \
    -e "WEB_HTTP_IDENTITY_PORT=8182" \
    -e "WEB_HTTP_IDENTITY_PATH=/api/identity" \
    -e "WEB_HTTP_PRESENTATION_PORT=10001" \
    -e "WEB_HTTP_PRESENTATION_PATH=/api/presentation" \
    -e "EDC_IAM_STS_PRIVATEKEY_ALIAS=privatekey-alias" \
    -e "EDC_IAM_STS_PUBLICKEY_ID=publickey-id" \
    -p 8182:8182 \
    -p 10001:10001\
    identityhub-memory:test
```