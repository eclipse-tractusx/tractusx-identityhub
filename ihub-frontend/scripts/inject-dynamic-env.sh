#!/bin/sh

#################################################################################
# Copyright (c) 2026 Contributors to the Eclipse Foundation
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
#################################################################################

source_file=${source_file:-/usr/share/nginx/html/index.html.reference}
target_file=${target_file:-/tmp/index.html}

string_vars=" \
IHUB_BACKEND_URL \
PARTICIPANT_ID \
REQUIRE_HTTPS_URL_PATTERN \
APP_ENVIRONMENT \
APP_VERSION \
API_TIMEOUT \
API_RETRY_ATTEMPTS \
API_KEY \
API_KEY_HEADER \
AUTH_ENABLED \
AUTH_PROVIDER \
AUTH_SESSION_TIMEOUT \
AUTH_RENEW_TOKEN_MIN_VALIDITY \
AUTH_LOGOUT_REDIRECT_URI \
KEYCLOAK_URL \
KEYCLOAK_REALM \
KEYCLOAK_CLIENT_ID \
KEYCLOAK_ON_LOAD \
KEYCLOAK_CHECK_LOGIN_IFRAME \
KEYCLOAK_SILENT_CHECK_SSO_REDIRECT_URI \
KEYCLOAK_PKCE_METHOD \
KEYCLOAK_ENABLE_LOGGING \
KEYCLOAK_MIN_VALIDITY \
KEYCLOAK_CHECK_LOGIN_IFRAME_INTERVAL \
KEYCLOAK_FLOW \
ENABLE_ADVANCED_LOGGING \
ENABLE_PERFORMANCE_MONITORING \
ENABLE_DEV_TOOLS \
UI_THEME \
UI_LOCALE \
UI_COMPACT_MODE \
"

sed_command="cat ${source_file} | sed -e \"s@^\\\s*//.*@@g\""

set -- $string_vars
while [ -n "$1" ]; do
  var=$1
  sed_command="${sed_command} -e \"s@${var}:[[:space:]]*\\\"[^\\\"]*\\\"@${var}: \\\"\${${var}}\\\"@g\""
  shift
done

echo ${sed_command} | sh > ${target_file}

echo "Variables injected correctly in $target_file"
