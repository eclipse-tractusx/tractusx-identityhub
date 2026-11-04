#!/usr/bin/env bash
#################################################################################
#  Copyright (c) 2026 Catena-X Automotive Network e.V.
#  Copyright (c) 2026 Contributors to the Eclipse Foundation
#
#  See the NOTICE file(s) distributed with this work for additional
#  information regarding copyright ownership.
#
#  This program and the accompanying materials are made available under the
#  terms of the Apache License, Version 2.0 which is available at
#  https://www.apache.org/licenses/LICENSE-2.0.
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#  License for the specific language governing permissions and limitations
#  under the License.
#
#  AI Disclosure: This file was entirely AI-generated.
#  The AI-generated portions are made available under CC0-1.0 and not subject
#  to the project's license. The human contributor has reviewed and verified
#  that the code is correct.
#
#  SPDX-License-Identifier: Apache-2.0 AND CC0-1.0
#  Assisted-By: Claude Code (claude-opus-5-5)
#################################################################################

# Trace one IdentityHub / IssuerService setting through every place it lives: the @Setting
# declaration (Tractus-X or upstream EDC), the ConfigMap templates of the four charts, the
# values.yaml entries, the runtime defaults (application.properties), the Docker Compose
# configuration, READMEs and docs, the migration guide, the CHANGELOG and the tests.
#
# Usage: setting-trace.sh <setting.key | ENV_VAR | .Values.path>
#   setting-trace.sh edc.tractusx.ih.participant.configurable.id
#   setting-trace.sh EDC_IAM_DID_WEB_USE_HTTPS
#   setting-trace.sh .Values.identityhub.didweb.https
set -euo pipefail

[ $# -eq 1 ] || { sed -n '/^# Trace one/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 1; }
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
SKILLS=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); SRC="$SKILLS/ih-upstream-sources/scripts/ih-src.sh"
IN="$1"; KEY=""; ENV=""; HELM=""

key_to_env() { echo "$1" | tr '[:lower:]' '[:upper:]' | tr '.-' '__'; }
yaml_line() { # <file> <dotted.path> -> line number of that key in a YAML file
  awk -v target="$2" '
    /^[[:space:]]*(#|$)/ { next }
    match($0, /^ *[A-Za-z0-9_.-]+:/) {
      ind = match($0, /[^ ]/) - 1
      k = $0; sub(/^ */, "", k); sub(/:.*/, "", k)
      while (n > 0 && lvl[n] >= ind) n--
      n++; lvl[n] = ind; key[n] = k
      p = key[1]; for (i = 2; i <= n; i++) p = p "." key[i]
      if (p == target) { print NR; exit }
    }' "$1"
}
hr() { printf '\n== %s\n' "$1"; }
G() { git grep "$@" 2>/dev/null || true; }
TPL='charts/*/templates/*'

case "$IN" in
  .Values.*|Values.*)
    HELM="${IN#.}"; HELM="${HELM#Values.}"
    # ConfigMap line "key: {{ ... .Values.<path> ... }}" -> key
    KEY=$(G -h -E -- "^ *[a-z][A-Za-z0-9._-]+: .*\.Values\.$HELM([^A-Za-z0-9_.]|\$)" -- "$TPL" | head -1 | sed -E 's/^ *([^:]+):.*/\1/')
    [ -n "$KEY" ] && ENV=$(key_to_env "$KEY") ;;
  *[a-z]*) KEY="$IN"; ENV=$(key_to_env "$IN") ;;
  *) ENV="$IN" ;;
esac
if [ -z "$KEY" ] && [ -n "$ENV" ]; then
  # derive the key from the env var: a matching dotted string in Java code, chart ConfigMaps, or upstream
  re=$(echo "$ENV" | tr '[:upper:]' '[:lower:]' | sed 's/_/[._-]/g')
  KEY=$(G -hoiE -- "\"$re\"" -- '*.java' | head -1 | tr -d '"')
  [ -n "$KEY" ] || KEY=$(G -hoiE -- "^ *$re:" -- "$TPL" '*.properties' | head -1 | sed -E 's/^ *//; s/:$//')
  [ -n "$KEY" ] || KEY=$(bash "$SRC" settings "^$re\$" 2>/dev/null | head -1 || true)
fi
kre=$(printf '%s' "$KEY" | sed 's/[.[\*^$/]/\\&/g')
printf 'Setting : %s\nEnv var : %s\nHelm    : %s\n' "${KEY:-?}" "${ENV:-?}" "${HELM:-(searching)}"

HAS_CODE=0; HAS_UP=0; HAS_CM=0; HAS_VALUES=0; HAS_DEF=0; HAS_DOC=0; HAS_MIG=0

hr "Declaration in Tractus-X code"
if [ -n "$KEY" ]; then
  lit=$(G -nF -- "\"$KEY\"" -- ':(glob)**/src/main/**/*.java')
  if [ -n "$lit" ]; then
    HAS_CODE=1; echo "$lit"
    for c in $(echo "$lit" | grep -oE '[A-Z][A-Z0-9_]+ *= *"' | grep -oE '^[A-Z][A-Z0-9_]+' | sort -u); do
      G -nE -- "key *= *([A-Za-z]+\.)?$c([^A-Za-z0-9_]|\$)|@Setting.*$c" -- ':(glob)**/src/main/**/*.java' | sed 's/^/   @Setting -> /'
    done
  else echo "   (not declared in Tractus-X main code)"; fi
fi

hr "Declaration in upstream EDC $(bash "$SRC" version 2>/dev/null || echo '?')"
if [ -n "$KEY" ]; then
  up=$(bash "$SRC" grep "\"$kre\"" 2>/dev/null | grep -v '/test/' | head -5 || true)
  if [ -n "$up" ]; then HAS_UP=1; echo "$up"; else
    echo "   (no literal \"$KEY\" upstream; it may be built by concatenation, e.g. \"web.http.\" + CONTEXT + \".port\":"
    pfx=$(echo "$KEY" | cut -d. -f1-2)
    bash "$SRC" grep "@Setting\(key = \"${pfx//./\\.}\\.\" *\+" 2>/dev/null | grep -v '/test/' | head -3 | sed 's/^/   /' || true
    echo "   )"
  fi
fi

hr "Helm ConfigMaps (key -> value)"
if [ -n "$KEY" ]; then
  t=$(G -n -E -- "^ *$kre:" -- "$TPL")
  if [ -n "$t" ]; then
    HAS_CM=1; echo "$t"
    [ -n "$HELM" ] || HELM=$(echo "$t" | grep -oE '\.Values\.[A-Za-z0-9_.]+' | sed 's/^\.Values\.//' | sort -u | tr '\n' ' ')
  else echo "   ($KEY is not set by any chart; operators set it via <svc>.env: $ENV, envValueFrom or envSecretNames)"; fi
  e=$(G -n -E -- "name: *\"?$ENV\"?" -- "$TPL")
  [ -n "$e" ] && { echo "   env var in templates:"; echo "$e" | sed 's/^/   /'; }
fi

hr "values.yaml"
if [ -n "${HELM// /}" ]; then
  for hp in $HELM; do
    for v in charts/*/values*.yaml; do
      ln=$(yaml_line "$v" "$hp")
      if [ -n "$ln" ]; then HAS_VALUES=1; echo "$v:$ln  ($hp)"; sed -n "$((ln > 2 ? ln - 2 : 1)),$((ln))p" "$v" | sed 's/^/   /'; fi
    done
  done
  [ "$HAS_VALUES" = 1 ] || echo "   (.Values.$HELM not found in any values.yaml)"
else echo "   (no Helm value maps to this setting)"; fi

hr "Runtime defaults and Docker Compose configuration"
if [ -n "$KEY" ]; then
  d=$(G -n -E -- "^ *#? *$kre *[=:]" -- 'runtimes/*/src/main/resources/*.properties' 'deployment/docker/*')
  d2=$(G -n -E -- "$ENV" -- 'deployment/docker/*')
  if [ -n "$d$d2" ]; then HAS_DEF=1; printf '%s\n%s\n' "$d" "$d2" | grep -v '^$'; else echo "   (not set in application.properties or the compose stack)"; fi
fi

hr "Docs (READMEs, docs/, chart READMEs)"
d=$(G -n -F -e "${KEY:-@@none@@}" -e "${ENV:-@@none@@}" -- '*.md' ':!docs/admin/migration-guide.md' ':!CHANGELOG.md' ':!.claude' ':!.github')
if [ -n "$d" ]; then HAS_DOC=1; echo "$d" | head -15; else echo "   (not documented)"; fi

hr "Migration guide and CHANGELOG (history of renames/removals)"
m=$(G -n -F -e "${KEY:-@@none@@}" -e "${ENV:-@@none@@}" ${HELM:+-e "$(echo "$HELM" | awk '{print $1}')"} -- docs/admin/migration-guide.md CHANGELOG.md)
if [ -n "$m" ]; then HAS_MIG=1; echo "$m" | head -10; else echo "   (never mentioned)"; fi

hr "Tests referencing it"
G -lF -e "${KEY:-@@none@@}" -e "${ENV:-@@none@@}" -- ':(glob)**/src/test/**' 'charts/*/templates/tests' 'tests' | sed 's/^/   /' | head -15

ok() { [ "$1" = 1 ] && echo "[x]" || echo "[ ]"; }
hr "Touchpoint summary"
echo "$(ok $HAS_CODE) declared in Tractus-X (@Setting)         $(ok $HAS_UP) declared upstream (literal)"
echo "$(ok $HAS_CM) set by a chart ConfigMap                $(ok $HAS_VALUES) value in values.yaml"
echo "$(ok $HAS_DEF) runtime default / compose config        $(ok $HAS_DOC) documented (README / docs)"
echo "$(ok $HAS_MIG) mentioned in migration guide/CHANGELOG"
