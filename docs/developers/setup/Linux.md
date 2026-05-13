# Linux Deployment Guide: IdentityHub and IssuerService

This guide combines the steps for Cluster Setup, Network Setup, and Installation for Linux users.

---

## 1. Cluster Setup

This guide provides instructions to set up a Kubernetes cluster required for running the IdentityHub and IssuerService Chart.

### Start Minikube

Start a Minikube cluster with the following command:

```bash
minikube start 
```

## 2. Network Setup

This guide provides instructions to configure the network setup required for running the IdentityHub and IssuerService Chart in a Kubernetes cluster.

### Enabled Ingresses

To enable ingress for local access, use the following command with Minikube:

```bash
minikube addons enable ingress
```

Make sure that the **DNS** resolution for the hosts is in place:

```bash
minikube addons enable ingress-dns
```

And execute installation step [3 Add the `minikube ip` as a DNS server](https://minikube.sigs.k8s.io/docs/handbook/addons/ingress-dns) for your OS

### DNS Resolution Setup

Proper DNS resolution is required to map local domain names to the Minikube IP address.

#### Hosts File Configuration

1. Open the hosts file you find here `/etc/hosts` and insert the values from below.

   ```text
   <MINIKUBE_IP>   identityhub.presentation.local
   <MINIKUBE_IP>   identityhub.identity.local
   <MINIKUBE_IP>   issuerservice.issuance.local
   <MINIKUBE_IP>   issuerservice.did.local
   ```

2. Replace `<MINIKUBE_IP>` with the output of the following command:

   ```bash
      minikube ip
   ```

3. Test DNS resolution by pinging one of the configured hostnames.

## 3. Localhost Deployment

For detailed installation instructions, please refer to the [Installation Guide](../../..//INSTALL.md)

> [!IMPORTANT]
> It is strongly recommended to deploy with **Ingress enabled**. In each component's `values.yaml`, there are two ingresses that have to be enabled to true. This allows you to use the internal URLs (e.g., `identityhub.presentation.local`) without additional configuration.
> [!WARNING]
> The path /.well-known is mandatory for did:web resolution. However, the Nginx Admission Webhook often blocks paths starting with a dot. You must edit the ingress.yaml file in the templates folder and change the pathType to ImplementationSpecific.

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2026 LKS Next
* SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractus-x-identityhub>
