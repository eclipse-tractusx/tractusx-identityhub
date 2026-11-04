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

# Create the next architecture decision record in docs/architecture/decision-records/ in the house
# format (Michael Nygard, see 001-record-architecture-decisions.md): NNN-<slug>.md with Date,
# Status, Context, Decision, Consequences and the CC-BY-4.0 NOTICE. Never overwrites a file.
#
# Usage: new-adr.sh "<Title>" [--status Proposed|Accepted|Superseded] [--supersedes NNN]
#   new-adr.sh "Encrypt participant configuration at rest"
set -euo pipefail
case "${1:-}" in -h|--help) sed -n '/^# Create the next architecture/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;; esac

[ $# -ge 1 ] || { sed -n '/^# Create the next architecture/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 1; }
TITLE="$1"; shift; STATUS="Proposed"; SUPERSEDES=""
while [ $# -gt 0 ]; do case "$1" in --status) STATUS="$2"; shift 2 ;; --supersedes) SUPERSEDES="$2"; shift 2 ;; *) echo "unknown option $1" >&2; exit 1 ;; esac; done
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
DIR=docs/architecture/decision-records
last=$(ls "$DIR" 2>/dev/null | grep -oE '^[0-9]{3}' | sort -n | tail -1 || true)
NUM=$(printf '%03d' $((10#${last:-0} + 1)))
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
F="$DIR/$NUM-$SLUG.md"
[ ! -e "$F" ] || { echo "$F exists" >&2; exit 1; }
YEAR=$(date +%Y); TODAY=$(date +%Y-%m-%d)
cat > "$F" <<EOF
<!--
Copyright (c) $YEAR Contributors to the Eclipse Foundation
See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This work is made available under the terms of the
Creative Commons Attribution 4.0 International (CC-BY-4.0) license,
which is available at
https://creativecommons.org/licenses/by/4.0/legalcode.

SPDX-License-Identifier: CC-BY-4.0

-->

# $((10#$NUM)). $TITLE

Date: $TODAY

## Status

$STATUS${SUPERSEDES:+

Supersedes [ADR $SUPERSEDES]($(ls "$DIR" | grep -E "^$SUPERSEDES-" | head -1))}

## Context

TODO: the forces at play: the problem, the constraints (DCP / Catena-X standards, upstream EDC
IdentityHub behaviour at the pinned version, operators, security), and the options considered.

## Decision

TODO: "We will …", in full sentences, active voice.

## Consequences

TODO: what becomes easier or harder: migration steps, settings, chart values, API changes,
follow-up work, and how the decision will be verified (tests, E2E flow).

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

* SPDX-License-Identifier: CC-BY-4.0
* SPDX-FileCopyrightText: $YEAR Contributors to the Eclipse Foundation
* Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/$F>
EOF
echo "Created $F"
echo "Next: fill Context/Decision/Consequences; link it from docs/architecture/README.md if the decision changes the architecture docs."
