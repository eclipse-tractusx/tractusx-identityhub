#!/bin/bash
###############################################################
# Eclipse Tractus-X - identity-hub
#
# Copyright (c) 2025 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
###############################################################

#
# setup-external-vault.sh
#
# Bootstraps a Kubernetes namespace and seeds an external HashiCorp Vault
# with the secrets required by the Tractus-X identity-hub Helm chart.
#
# Prerequisites:
#   - kubectl configured and authenticated against your cluster
#   - vault CLI installed (https://developer.hashicorp.com/vault/install)
#   - The target Vault instance is reachable and unsealed
#
# Usage:
#   export VAULT_ADDR="https://vault.example.com"
#   export VAULT_TOKEN="<your-root-or-admin-token>"
#   ./setup-external-vault.sh
#
# All values below can be overridden via environment variables before running
# the script. Defaults are provided for convenience (NOT production-ready).
#

set -euo pipefail

###############################################################
# Configuration — override via environment variables
###############################################################

# -- Kubernetes namespace where identity-hub will be deployed
NAMESPACE="${NAMESPACE:-identity-hub}"

# -- Vault address (must be set or exported before running)
VAULT_ADDR="${VAULT_ADDR:?'VAULT_ADDR must be set (e.g. https://vault.example.com)'}"

# -- Vault token with write permissions to the KV engine
VAULT_TOKEN="${VAULT_TOKEN:?'VAULT_TOKEN must be set'}"

# -- KV v2 secrets engine mount path (no leading/trailing slashes)
VAULT_KV_MOUNT="${VAULT_KV_MOUNT:-secret}"

# -- Prefix for all identity-hub secrets inside the KV engine
VAULT_SECRET_PREFIX="${VAULT_SECRET_PREFIX:-identity-hub}"

# -- PostgreSQL credentials
DB_USERNAME="${DB_USERNAME:-user}"
DB_PASSWORD="${DB_PASSWORD:-password}"

# -- API auth key aliases (stored in vault so the runtime can resolve them)
IDENTITY_AUTH_KEY="${IDENTITY_AUTH_KEY:-sup3r\$3cr3t}"
ACCOUNTS_AUTH_KEY="${ACCOUNTS_AUTH_KEY:-sup3r\$3cr3t}"

# -- Vault connection details that the chart itself will use at runtime
#    (written into vault so AVP can inject them into the Helm values)
VAULT_URL="${VAULT_URL:-${VAULT_ADDR}}"
VAULT_RUNTIME_TOKEN="${VAULT_RUNTIME_TOKEN:-${VAULT_TOKEN}}"
VAULT_SECRET_PATH="${VAULT_SECRET_PATH:-/v1/${VAULT_KV_MOUNT}}"

###############################################################
# Helper
###############################################################

info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; exit 1; }

check_command() {
  command -v "$1" >/dev/null 2>&1 || error "'$1' is required but not installed."
}

###############################################################
# Pre-flight checks
###############################################################

info "Running pre-flight checks …"
check_command kubectl
check_command vault

export VAULT_ADDR VAULT_TOKEN

# Verify vault connectivity
vault status >/dev/null 2>&1 || error "Cannot reach Vault at ${VAULT_ADDR}. Is it unsealed and reachable?"
ok "Vault at ${VAULT_ADDR} is reachable."

###############################################################
# 1. Create Kubernetes namespace
###############################################################

info "Creating Kubernetes namespace '${NAMESPACE}' (if it does not exist) …"
if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  warn "Namespace '${NAMESPACE}' already exists — skipping."
else
  kubectl create namespace "${NAMESPACE}"
  ok "Namespace '${NAMESPACE}' created."
fi

# Label the namespace for easier identification
kubectl label namespace "${NAMESPACE}" app.kubernetes.io/part-of=tractusx-identity-hub --overwrite >/dev/null
ok "Namespace '${NAMESPACE}' labelled."

###############################################################
# 2. Enable KV v2 secrets engine (idempotent)
###############################################################

info "Ensuring KV v2 secrets engine is enabled at '${VAULT_KV_MOUNT}/' …"
if vault secrets list -format=json | grep -q "\"${VAULT_KV_MOUNT}/\""; then
  warn "Secrets engine '${VAULT_KV_MOUNT}/' already enabled — skipping."
else
  vault secrets enable -path="${VAULT_KV_MOUNT}" kv-v2
  ok "KV v2 engine enabled at '${VAULT_KV_MOUNT}/'."
fi

###############################################################
# 3. Write secrets into Vault
###############################################################

info "Writing identity-hub secrets into Vault under '${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/' …"

# --- Database credentials ---
vault kv put "${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/db" \
  username="${DB_USERNAME}" \
  password="${DB_PASSWORD}"
ok "  ${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/db"

# --- API auth keys ---
vault kv put "${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/api" \
  identityAuthKeyAlias="${IDENTITY_AUTH_KEY}" \
  accountsAuthKeyAlias="${ACCOUNTS_AUTH_KEY}"
ok "  ${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/api"

# --- Vault self-reference (so AVP can inject vault connection details into the chart) ---
vault kv put "${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/vault" \
  url="${VAULT_URL}" \
  token="${VAULT_RUNTIME_TOKEN}" \
  secretPath="${VAULT_SECRET_PATH}"
ok "  ${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/vault"

###############################################################
# 4. (Optional) Seed runtime secrets used by the identity-hub
#    These are secrets the identity-hub runtime resolves FROM
#    vault at startup (e.g. token signer keys).
###############################################################

info "Seeding optional runtime secrets …"

# Example: token signer key-pair (replace with real keys for production!)
# The aliases below must match what is configured in the Helm values
# (e.g. dataplane.token.signer.privatekey_alias / publickey_alias).

SEED_TOKEN_KEYS="${SEED_TOKEN_KEYS:-false}"
if [[ "${SEED_TOKEN_KEYS}" == "true" ]]; then
  if [[ -z "${TOKEN_SIGNER_PRIVATE_KEY:-}" || -z "${TOKEN_SIGNER_PUBLIC_KEY:-}" ]]; then
    warn "SEED_TOKEN_KEYS=true but TOKEN_SIGNER_PRIVATE_KEY / TOKEN_SIGNER_PUBLIC_KEY not set — skipping."
  else
    vault kv put "${VAULT_KV_MOUNT}/tokenSignerPrivateKey" content="${TOKEN_SIGNER_PRIVATE_KEY}"
    vault kv put "${VAULT_KV_MOUNT}/tokenSignerPublicKey"  content="${TOKEN_SIGNER_PUBLIC_KEY}"
    ok "  Token signer key-pair written."
  fi
else
  info "  Skipping token signer keys (set SEED_TOKEN_KEYS=true to enable)."
fi

###############################################################
# Done
###############################################################

echo ""
ok "Setup complete!"
echo ""
info "Vault secrets written under:  ${VAULT_KV_MOUNT}/${VAULT_SECRET_PREFIX}/*"
info "Kubernetes namespace:         ${NAMESPACE}"
echo ""
info "You can now deploy with:"
echo "  helm install identity-hub charts/tractusx-identity-hub \\"
echo "    -n ${NAMESPACE} \\"
echo "    -f charts/tractusx-identity-hub/values-int.yaml"
echo ""
