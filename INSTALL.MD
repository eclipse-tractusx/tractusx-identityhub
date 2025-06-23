# Tools Needed to Deplot IdentityHub

## Prerequisites

- Docker v28.2.2
- Minikube v1.31.2
- Helm v3.18.1

## Install tools

### Docker
```shell
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```
#### Install specific docker version
```shell
# List the available versions:
apt-cache madison docker-ce | awk '{ print $3 }'

# Install specific version
VERSION_STRING=5:28.2.2-1~ubuntu.24.04~noble
sudo apt-get install docker-ce=$VERSION_STRING docker-ce-cli=$VERSION_STRING containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Install latest docker version
```shell
# Install latest version
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
### Minikube

```shell
# Latest minikube stable release
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

### Helm

```shell
# Get latest version
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

## Launching the application in localhost

This section prepares and builds the application directly from localhost with no use of Docker Hub to pull images from the cloud.
That means we generate the artifact, build the docker image and load it into kubernetes and deploy with helm charts.

### Build the Jar File
You can generate the artifact with the following command.

```shell
./gradlew clean build
```

### Run IdentityHub as Java

Once the jar is built, you can try to run it with the following command, or build it into a docker image in the next step.
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
     -jar runtimes/identityhub-memory/build/libs/identity-hub.jar
```

### Create Docker Image

Build the docker image

```shell
# Path: tractusx-identityhub/
docker build runtimes/identityhub-memory/ -t identityhub-memory:latest -f runtimes/identityhub-memory/Dockerfile
```

Or build the image going to the runtime/identityhub-memory module
```shell
# Path: tractusx-identityhub/runtime/identotyhub-memory/
docker build . -t identityhub-memory:latest
```

### Run Docker Image

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
    identityhub-memory:latest
```

### Load Docker Image into Minikube
```shell
minikube image load identityhub-memory:latest
```

### Deploy IdentityHub-memory with Helm Charts

```shell
# Path: tractusx-identityhub/
helm install identityhub-memory charts/tractusx-identityhub-memory/ \
    --set "identityhub.endpoints.identity.authKey=password" \
    --set "identityhub.securityContext.readOnlyRootFilesystem=false" \
    --set "fullnameOverride=identityhub" \
    --set "identityhub.image.pullPolicy=Never" \
    --set "identityhub.image.tag=latest" \
    --set "identityhub.image.repository=identityhub-memory" \
    --wait-for-jobs \
    --timeout=120s \
    --dependency-update
```