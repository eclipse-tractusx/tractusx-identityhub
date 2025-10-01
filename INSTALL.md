# Deploying Helm Charts in localhost

> [!NOTE]
> This guide has been tested with Linux OS distribution

This document shows a step by step process in order to successfully deploy
all different helm charts available in this repository in localhost.

The process prepares and builds the application directly from localhost with 
no use of Docker Hub to pull images from the cloud. That means we generate the 
artifact, build the docker image and load it into kubernetes and deploy with helm charts.


## Deployments

- [identityhub-memory](#deploying-identityhub-memory)
- [identityhub](#deploying-identityhub)
- [issuerservice-memory](#deploying-issuerservice-memory)
- [issuerservice](#deploying-issuerservice)

## Prerequisites

This section describes the tools necessary to deploy the final helm chart and the versions that have been tested for the localhost deployment.

- [Docker](https://docs.docker.com/engine/install/ubuntu/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [Helm](https://helm.sh/docs/intro/install/)

## Deploying identityhub-memory

### Build the Jar File
```shell
./gradlew clean build
```

### Create Docker Image

```shell
# Path: tractusx-identityhub/
docker build runtimes/identityhub-memory/ -t identityhub-memory:test -f runtimes/identityhub-memory/Dockerfile
```

### Load Docker Image into Minikube
```shell
minikube image load identityhub-memory:test
```

### Deploy Identityhub-memory with Helm Charts
```shell
# Path: tractusx-identityhub/
helm install identityhub-memory charts/tractusx-identityhub-memory/ \
    --set "identityhub.image.tag=test" \
    --set "identityhub.image.repository=identityhub-memory" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update \
```

For helm chart options and configuration, see [Helm chart documentation](https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/charts/tractusx-identityhub-memory/README.md)

### Alternative ways to deploy identityhub-memory

In case you don't want to deploy the helm chart, here are other ways to deploy the application.

### Java application

```shell
java -Dedc.fs.config=runtimes/identityhub-memory/build/resources/main/application.properties
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

## Deploying identityhub

### Build the Jar File
```shell
./gradlew clean build
```

### Create Docker Image

```shell
# Path: tractusx-identityhub/
docker build runtimes/identityhub/ -t identityhub:test -f runtimes/identityhub/Dockerfile
```

### Load Docker Image into Minikube
```shell
minikube image load identityhub:test
```

### Deploy Identityhub with Helm Charts
```shell
# Path: tractusx-identityhub/
helm install identityhub charts/tractusx-identityhub/ \
    --set "identityhub.image.tag=test" \
    --set "identityhub.image.repository=identityhub" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update
```

# Deploying issuerservice-memory

### Build the Jar File

```shell
./gradlew clean build
```

### Create Docker Image

```shell
# Path: tractusx-issuerservice/
docker build runtimes/issuerservice-memory/ -t issuerservice-memory:test -f runtimes/issuerservice-memory/Dockerfile
```

### Load Docker Image into Minikube
```shell
minikube image load issuerservice-memory:test
```

### Deploy Issuerservice-memory with Helm Charts

```shell
# Path: tractusx-issuerservice/
helm install issuerservice-memory charts/tractusx-issuerservice-memory/ \
    --set "issuerservice.image.tag=test" \
    --set "issuerservice.image.repository=issuerservice-memory" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update
```
For helm chart options and configuration, see [Helm chart documentation](https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/charts/tractusx-issuerservice-memory/README.md)

## Alternative ways to deploy issuerservice-memory

In case you don't want to deploy the helm chart, here are other ways to deploy the application.

### Run the java application

```shell
java -Dedc.fs.config=runtimes/issuerservice-memory/build/resources/main/application.properties
    -jar runtimes/issuerservice-memory/build/libs/issuerservice-memory.jar
```

# Deploying issuerservice

### Build the Jar File

```shell
./gradlew clean build
```

### Create Docker Image

```shell
# Path: tractusx-issuerservice/
docker build runtimes/issuerservice/ -t issuerservice:test -f runtimes/issuerservice/Dockerfile
```

### Load Docker Image into Minikube
```shell
minikube image load issuerservice:test
```

### Deploy Issuerservice with Helm Charts

```shell
# Path: tractusx-issuerservice/
helm install issuerservice charts/tractusx-issuerservice/ \
    --set "issuerservice.image.tag=test" \
    --set "issuerservice.image.repository=issuerservice" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update
```
For helm chart options and configuration, see [Helm chart documentation](https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/charts/tractusx-issuerservice-memory/README.md)
