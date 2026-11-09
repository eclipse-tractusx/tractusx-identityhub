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

# Read upstream Eclipse EDC sources (IdentityHub, IssuerService, STS, DCP, connector core) at an
# exact version (default: the `edc` version pinned in gradle/libs.versions.toml).
# The artifact set is resolved from the BOMs this repository ships (identityhub-bom,
# issuerservice-bom and their -sql feature BOMs) plus every org.eclipse.edc library in the version
# catalog, walking their POMs transitively. Sources come from the local Gradle cache; missing ones
# are downloaded from Maven Central. Everything is extracted to a cache outside the repository.
#
# Usage: ih-src.sh <command> [args]
#   version                        print the pinned upstream EDC version
#   artifacts [version]            list the resolved org.eclipse.edc artifacts
#   path      [version]            extract sources (once) and print the extracted directory
#   find      <regex> [version]    list source files whose path matches <regex> (e.g. 'PresentationApi')
#   read      <Class|regex> [version]   print the source of the best match (other matches are listed)
#   grep      <regex> [version]    grep all upstream .java sources (extended regex)
#   diff      <Class|regex> <old> <new>  unified diff of a class between two versions
#   settings  [regex] [version]    list upstream @Setting keys (optionally filtered)
#   endpoints [regex] [version]    list upstream JAX-RS endpoints: METHOD path  <- Controller (artifact)
#   schema    [regex] [version]    list upstream SQL schema files, or print it when exactly one matches
#   schemas   [regex] [version]    only list the matching SQL schema files (artifact/file.sql)
#
# Environment: IH_SRC_CACHE (default ~/.cache/ih-sources), GRADLE_USER_HOME, EDC_MAVEN_REPO,
#              IH_SRC_OFFLINE=1 (never download; only the Gradle cache is used).
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
GRADLE_EDC="${GRADLE_USER_HOME:-$HOME/.gradle}/caches/modules-2/files-2.1/org.eclipse.edc"
CACHE="${IH_SRC_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/ih-sources}"
MAVEN="${EDC_MAVEN_REPO:-https://repo1.maven.org/maven2}/org/eclipse/edc"
OFFLINE="${IH_SRC_OFFLINE:-0}"
SEED_BOMS="identityhub-bom identityhub-feature-sql-bom issuerservice-bom issuerservice-feature-sql-bom"

die() { echo "ih-src: $*" >&2; exit 1; }

pinned_version() {
  local v
  v=$(grep -E '^edc *= *"' "$ROOT/gradle/libs.versions.toml" 2>/dev/null | head -1 | cut -d'"' -f2)
  [ -n "$v" ] || die "cannot read 'edc' version from $ROOT/gradle/libs.versions.toml"
  echo "$v"
}

# Local file for an artifact's <kind> (pom | sources.jar | jar), downloading it when allowed.
fetch() { # <artifact> <version> <kind> -> path or empty
  local a="$1" v="$2" k="$3" name f
  case "$k" in pom) name="$a-$v.pom" ;; sources.jar) name="$a-$v-sources.jar" ;; jar) name="$a-$v.jar" ;; esac
  f=$(find "$GRADLE_EDC/$a/$v" -name "$name" 2>/dev/null | head -1 || true)
  [ -n "$f" ] && { echo "$f"; return; }
  f="$CACHE/jars/$v/$name"
  [ -s "$f" ] && { echo "$f"; return; }
  [ "$OFFLINE" = 1 ] && return 0
  mkdir -p "$CACHE/jars/$v"
  if curl -fsSL -o "$f.part" "$MAVEN/$a/$v/$name" 2>/dev/null; then mv "$f.part" "$f"; echo "$f"; else rm -f "$f.part"; fi
}

# org.eclipse.edc dependencies (non-test) of a POM at the same version.
pom_deps() { # <pom file> <version>
  awk -v v="$2" '
    /<dependency>/ { g = ""; a = ""; ver = ""; s = ""; inside = 1 }
    inside && /<groupId>/    { g = $0;   gsub(/.*<groupId>|<\/groupId>.*/, "", g) }
    inside && /<artifactId>/ { a = $0;   gsub(/.*<artifactId>|<\/artifactId>.*/, "", a) }
    inside && /<version>/    { ver = $0; gsub(/.*<version>|<\/version>.*/, "", ver) }
    inside && /<scope>/      { s = $0;   gsub(/.*<scope>|<\/scope>.*/, "", s) }
    /<\/dependency>/ { inside = 0; if (g == "org.eclipse.edc" && s != "test" && (ver == "" || ver == v)) print a }' "$1"
}

# Transitive artifact set for a version, cached in $CACHE/<v>.artifacts.
artifact_list() {
  local v="$1" out="$CACHE/$1.artifacts"
  [ -s "$out" ] && { cat "$out"; return; }
  mkdir -p "$CACHE"
  local queue seen="" a pom next
  queue="$SEED_BOMS $(grep -E 'module *= *"org\.eclipse\.edc:' "$ROOT/gradle/libs.versions.toml" 2>/dev/null \
    | grep -E 'version\.ref *= *"edc"' | sed -E 's/.*org\.eclipse\.edc:([^"]+)".*/\1/' | tr '\n' ' ')"
  while [ -n "${queue// /}" ]; do
    next=""
    # prefetch this level's POMs in parallel
    if [ "$OFFLINE" != 1 ]; then
      mkdir -p "$CACHE/jars/$v"
      for a in $queue; do
        [ -n "$(find "$GRADLE_EDC/$a/$v" -name "$a-$v.pom" 2>/dev/null | head -1)" ] || [ -s "$CACHE/jars/$v/$a-$v.pom" ] || echo "$a"
      done | sort -u | xargs -n 1 -P 8 sh -c 'f="$1/$4-$2.pom"; curl -fsSL -o "$f.part" "$3/$4/$2/$4-$2.pom" 2>/dev/null && mv "$f.part" "$f" || rm -f "$f.part"' _ "$CACHE/jars/$v" "$v" "$MAVEN" || true
    fi
    for a in $queue; do
      case " $seen " in *" $a "*) continue ;; esac
      seen="$seen $a"
      pom=$(fetch "$a" "$v" pom)
      [ -n "$pom" ] && next="$next $(pom_deps "$pom" "$v" | tr '\n' ' ')"
    done
    queue="$next"
  done
  echo "$seen" | tr ' ' '\n' | grep -v '^$' | sort -u > "$out.part"
  [ -s "$out.part" ] || { rm -f "$out.part"; die "could not resolve any artifact for EDC $v (offline and not in the Gradle cache?)"; }
  # cache only when the seed BOMs resolved, so an offline run is retried later
  if [ -n "$(fetch identityhub-bom "$v" pom)" ]; then mv "$out.part" "$out"; cat "$out"; else cat "$out.part"; rm -f "$out.part"; fi
}

# Extract all sources of a version into $CACHE/<version>/<artifact>/ (idempotent).
ensure_extracted() {
  local v="$1" dir="$CACHE/$1"
  [ -f "$dir/.complete" ] && { echo "$dir"; return; }
  mkdir -p "$dir"
  local list a jar missing=0 extracted=0
  list=$(artifact_list "$v")
  # prefetch missing sources in parallel
  if [ "$OFFLINE" != 1 ]; then
    for a in $list; do
      [ -d "$dir/$a" ] && continue
      [ -n "$(find "$GRADLE_EDC/$a/$v" -name "$a-$v-sources.jar" 2>/dev/null | head -1)" ] && continue
      [ -s "$CACHE/jars/$v/$a-$v-sources.jar" ] && continue
      echo "$a"
    done | xargs -n 1 -P 8 sh -c 'mkdir -p "$1"; f="$1/$4-$2-sources.jar"; curl -fsSL -o "$f.part" "$3/$4/$2/$4-$2-sources.jar" 2>/dev/null && mv "$f.part" "$f" || rm -f "$f.part"' _ "$CACHE/jars/$v" "$v" "$MAVEN" || true
  fi
  for a in $list; do
    [ -d "$dir/$a" ] && { extracted=$((extracted + 1)); continue; }
    jar=$(fetch "$a" "$v" sources.jar)
    if [ -z "$jar" ]; then missing=$((missing + 1)); continue; fi
    mkdir -p "$dir/$a" && unzip -qo "$jar" -d "$dir/$a" '*.java' 2>/dev/null || true
    extracted=$((extracted + 1))
  done
  [ "$extracted" -gt 0 ] || die "no sources found for EDC $v"
  echo "extracted $extracted artifacts for EDC $v ($missing without sources, e.g. BOMs) -> $dir" >&2
  # BOMs have no sources; mark complete only when (almost) everything else is there
  local boms; boms=$(echo "$list" | grep -c -- '-bom$' || true)
  if [ $(( (missing - boms) * 10 )) -le "$extracted" ]; then touch "$dir/.complete"; else
    echo "ih-src: warning: $missing artifacts without sources (offline?); will retry next run" >&2; fi
  echo "$dir"
}

# SQL schemas ship in the main jars of the *-sql store artifacts; extract them to $CACHE/<version>-sql/.
ensure_sql_extracted() {
  local v="$1" dir="$CACHE/$1-sql" a jar
  [ -f "$dir/.complete" ] && { echo "$dir"; return; }
  mkdir -p "$dir"
  for a in $(artifact_list "$v" | grep -E 'sql' | grep -vE 'bom$'); do
    jar=$(fetch "$a" "$v" jar)
    [ -n "$jar" ] && { mkdir -p "$dir/$a"; unzip -qo "$jar" -d "$dir/$a" '*.sql' 2>/dev/null || true; }
  done
  find "$dir" -type d -empty -delete 2>/dev/null || true
  mkdir -p "$dir"; touch "$dir/.complete"; echo "$dir"
}

find_files() { (cd "$2" && find . -name '*.java' | sed 's#^\./##' | grep -E -- "$1" || true); }
best_match() { # prefer an exact class-name match
  local exact; exact=$(echo "$1" | grep -E "/${2}\.java$" | head -1 || true)
  [ -n "$exact" ] && echo "$exact" || echo "$1" | head -1
}

cmd="${1:-}"; shift || true
case "$cmd" in
  version) pinned_version ;;
  artifacts) artifact_list "${1:-$(pinned_version)}" ;;
  path) ensure_extracted "${1:-$(pinned_version)}" ;;
  find)
    [ $# -ge 1 ] || die "usage: find <regex> [version]"
    dir=$(ensure_extracted "${2:-$(pinned_version)}")
    find_files "$1" "$dir" | awk -F/ '{a=$1; sub(/^[^\/]+\//,""); printf "%-45s %s\n", a, $0}' ;;
  read)
    [ $# -ge 1 ] || die "usage: read <Class|regex> [version]"
    v="${2:-$(pinned_version)}"; dir=$(ensure_extracted "$v")
    m=$(find_files "$1" "$dir"); [ -n "$m" ] || die "no source matching '$1' in EDC $v"
    f=$(best_match "$m" "$1"); n=$(echo "$m" | wc -l | tr -d ' ')
    if [ "$n" -gt 1 ]; then echo "# $n matches; showing the best one. Others:"; echo "$m" | grep -vxF "$f" | sed 's/^/#   /' | head -20; fi
    echo "# org.eclipse.edc:${f%%/*}:$v  ->  ${f#*/}"
    cat -n "$dir/$f" ;;
  grep)
    [ $# -ge 1 ] || die "usage: grep <regex> [version]"
    dir=$(ensure_extracted "${2:-$(pinned_version)}")
    (cd "$dir" && grep -rnE --include='*.java' -- "$1" . | sed 's#^\./##' || true) ;;
  diff)
    [ $# -ge 3 ] || die "usage: diff <Class|regex> <old-version> <new-version>"
    d1=$(ensure_extracted "$2"); d2=$(ensure_extracted "$3")
    m1=$(find_files "$1" "$d1"); m2=$(find_files "$1" "$d2"); f1=""; f2=""
    [ -n "$m1" ] && f1=$(best_match "$m1" "$1")
    [ -n "$m2" ] && f2=$(best_match "$m2" "$1")
    [ -n "$f1" ] || [ -n "$f2" ] || die "'$1' not found in $2 or $3"
    [ -n "$f1" ] || { echo "# added in $3: $f2"; exit 0; }
    [ -n "$f2" ] || { echo "# removed in $3 (was $f1). Same simple name elsewhere in $3:"; find_files "/$(basename "$f1")$" "$d2" | sed 's/^/#   /'; exit 0; }
    [ "${f1#*/}" = "${f2#*/}" ] || echo "# moved: $f1 -> $f2"
    diff -u --label "$2/$f1" --label "$3/$f2" "$d1/$f1" "$d2/$f2" || true ;;
  settings)
    dir=$(ensure_extracted "${2:-$(pinned_version)}")
    (cd "$dir" && {
      grep -rhE --include='*.java' -A4 '@Setting\(' . | grep -oE '"(edc|web|tx|tractusx)\.[A-Za-z0-9.<>_-]+"' || true
      grep -rhE --include='*.java' 'static final String [A-Z0-9_]+ *= *"(edc|web)\.[a-z0-9.<>_-]+"' . | grep -oE '"[^"]+"' || true
    } | tr -d '"' | sort -u | grep -E -- "${1:-.}" || true) ;;
  endpoints)
    dir=$(ensure_extracted "${2:-$(pinned_version)}")
    # value of the Versions.UNSTABLE constant (e.g. /v1beta) used in @Path expressions
    vu=$(find "$dir" -name Versions.java -exec grep -hoE 'UNSTABLE *= *"[^"]+"' {} \; 2>/dev/null | head -1 | cut -d'"' -f2)
    # class-level @Path + method-level @GET/@POST/... [@Path]
    (cd "$dir" && grep -rlE --include='*.java' '@(GET|POST|PUT|DELETE|PATCH)([^A-Za-z]|$)' . | sed 's#^\./##' | grep -v '/test/' | sort | while read -r f; do
      awk -v file="$f" -v vu="$vu" '
        function pexpr(l,   s) { s = l; sub(/.*@Path\(/, "", s); sub(/\)[^)]*$/, "", s); gsub(/"/, "", s); gsub(/ *\+ */, "", s); gsub(/Versions\.UNSTABLE/, vu, s); return s }
        /^[[:space:]]*@Path\(/ && !in_class { base = pexpr($0); next }
        /(class|interface|record) [A-Z]/ && !in_class { in_class = 1; c = $0; sub(/.*(class|interface|record) /, "", c); sub(/[^A-Za-z0-9_].*/, "", c); cls = c; next }
        in_class && /^[[:space:]]*@(GET|POST|PUT|DELETE|PATCH)([^A-Za-z]|$)/ { m = $0; gsub(/[^A-Z]/, "", m); meth = m; sub_path = ""; want = 1; next }
        in_class && want && /^[[:space:]]*@Path\(/ { sub_path = pexpr($0); next }
        in_class && want && /\(/ && !/^[[:space:]]*@/ { a = file; sub(/\/.*/, "", a); sep = (sub_path != "" && sub_path !~ /^\// && base !~ /\/$/) ? "/" : ""; printf "%-7s %-75s <- %s (%s)\n", meth, base sep sub_path, cls, a; want = 0 }
      ' "$dir/$f"
    done | grep -E -- "${1:-.}" || true) ;;
  schemas)
    dir=$(ensure_sql_extracted "${2:-$(pinned_version)}")
    (cd "$dir" && find . -name '*.sql' | sed 's#^\./##' | grep -E -- "${1:-.}" | sort || true) ;;
  schema)
    dir=$(ensure_sql_extracted "${2:-$(pinned_version)}")
    m=$(cd "$dir" && find . -name '*.sql' | sed 's#^\./##' | grep -E -- "${1:-.}" | sort || true)
    [ -n "$m" ] || die "no SQL schema matching '${1:-.}'"
    if [ "$(echo "$m" | wc -l | tr -d ' ')" = 1 ]; then cat "$dir/$m"; else echo "$m"; fi ;;
  ""|-h|--help|help) sed -n '/^# Read upstream/,/^set -euo/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//' ;;
  *) die "unknown command '$cmd' (try --help)" ;;
esac
