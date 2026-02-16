# Migration Guide

This migration guide is based on the `chartVersion` of the chart. If you don't rely on the provided helm chart, consider the changes of the chart as mentioned below manually.

## Upgrade to PostgreSQL 18 (CloudPirates)

> [!IMPORTANT]
> **Major Database Version Upgrade (15.4 -> 18.0)**
>
> This release updates the PostgreSQL database dependency from version 15.4 to 18.0 and switches the upstream chart provider to CloudPirates.
>
> **Data Compatibility Warning:**
> The data files between PostgreSQL 15 and 18 are **not compatible**. If you are upgrading an existing installation with persistent data:
> 1. Automatic upgrades are **not supported**. The database pod will fail to start if it detects an older data version.
> 2. You must **backup (dump)** your data and restore it manually, or delete the existing Persistent Volume Claim (PVC) if data retention is not required (e.g., in dev/test environments).

### Action Required: Remove Legacy Workarounds

The previous workaround for the Bitnami licensing issue (`bitnamilegacy`) has been removed. The chart now defaults to `postgres:18.0`.

#### 1. Changes in `values.yaml` of IH and IS Charts

If you are overriding values, check your `values.yaml` and **remove** the manual image configuration for PostgreSQL.

**Remove the following block:**

```yaml
# --------------------------------------------------------
#  REMOVE THIS BLOCK FROM YOUR VALUES.YAML
# --------------------------------------------------------
postgresql:
  image:
    repository: bitnamilegacy/postgresql
    tag: 15.4.0-debian-11-r45
# --------------------------------------------------------


```
**Add the following block:**

```yaml
# --------------------------------------------------------
#  ADD THIS BLOCK FROM YOUR VALUES.YAML
# --------------------------------------------------------
postgresql:
  image:
    # -- PostgreSQL image registry
    registry: docker.io
    # -- PostgreSQL image repository
    repository: postgres
    # -- PostgreSQL image tag
    tag: "18.0@sha256:1ffc019dae94eca6b09a49ca67d37398951346de3c3d0cfe23d8d4ca33da83fb"
```


# NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractus-x-umbrella>
