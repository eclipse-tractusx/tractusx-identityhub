# Identity Captain

<img src="../../../.github/agents/identity-captain.png" width="96" align="right" alt="Identity Captain avatar">

> *"To boldly verify what no one has verified before."* 🖖

The **Identity Captain** is an AI agent for developing and operating the Tractus-X IdentityHub and IssuerService. It
knows this repository, the upstream Eclipse EDC IdentityHub version it distributes, and the specifications behind both:
DCP, W3C DIDs and Verifiable Credentials, and the Catena-X standards. It answers from **evidence it opens in the
session**, such as source code, configuration, docs and specs, and cites `file:line`. It does not answer from memory.

Its personality is a calm, Starfleet-inspired captain: composed under pressure, technically precise and mission-focused.
It is a member of the Tractus-X agent crew, next to the **Connector Sensei** (Tractus-X EDC), the **Umbrella Guardian**
(tractus-x-umbrella) and the **KIT Master Builder** (eclipse-tractusx.github.io).

It works with **Claude Code** and **GitHub Copilot**. Its procedures and deterministic helper scripts, the *skills*, are
shared by both. [How the skills work](skills.md) explains the idea behind them.

<!-- TOC -->
- [What is in the repository](#what-is-in-the-repository)
- [Prerequisites](#prerequisites)
- [Using it with Claude Code](#using-it-with-claude-code)
- [Using it with GitHub Copilot](#using-it-with-github-copilot)
- [What to ask: example requests](#what-to-ask-example-requests)
- [Using the scripts without an AI](#using-the-scripts-without-an-ai)
- [What the Captain does and does not do](#what-the-captain-does-and-does-not-do)
- [Maintaining the Captain](#maintaining-the-captain)
- [Troubleshooting](#troubleshooting)
<!-- TOC -->

## What is in the repository

| Path | Purpose |
|---|---|
| [`.claude/agents/identity-captain.md`](../../../.claude/agents/identity-captain.md) | The agent for Claude Code (subagent definition: persona, knowledge map, ground rules, playbooks) |
| [`.github/agents/identity-captain.agent.md`](../../../.github/agents/identity-captain.agent.md) | The same agent for GitHub Copilot (custom agent), with the avatar as `icon` |
| [`.github/copilot-instructions.md`](../../../.github/copilot-instructions.md) | Repository-wide Copilot instructions: Copilot adopts the Captain identity and its rules even when the agent is not selected |
| [`.claude/skills/`](../../../.claude/skills/README.md) | The skills: one folder per task with `SKILL.md` (procedure) and `scripts/` (deterministic tooling). Loaded by Claude Code and Copilot |
| [`.github/agents/REUSE.toml`](../../../.github/agents/REUSE.toml) | License information for the avatar images (CC-BY-4.0) |
| [`.github/agents/identity-captain-profile.png`](../../../.github/agents/identity-captain-profile.png) | 256px avatar used in the GitHub comment header (`identity-captain.png` is the 128px Copilot icon, `-large.png` the 1024px source) |
| [`comment-template.md`](comment-template.md) | The template the Captain uses on GitHub (issues, comments, PR descriptions, reviews): avatar header, AI disclosure, evidence section, sign-off |

## Prerequisites

The agent itself needs only Claude Code or GitHub Copilot with this repository open. The skill scripts use standard
tools:

| Tool | Needed for |
|---|---|
| `git`, `bash` (3.2+ is enough, i.e. stock macOS), `awk`, `sed`, `unzip`, `curl`, `perl` | All scripts |
| `node` (18+) | `did-inspect.sh`, `jwt-inspect.sh`, `api-inventory.sh coverage`, `dcp-e2e.sh` (newman via `npx`) |
| JDK 17+ and the Gradle wrapper | Builds and tests, `dash-check.sh`, `api-inventory.sh drift`, scaffold verification |
| Docker | `dcp-e2e.sh` (compose stack) and `PostgresqlIntegrationTest` (Testcontainers) |
| Network access to Maven Central and `repo.eclipse.org` | Downloading upstream sources the first time, Eclipse Dash |

Upstream sources are cached in `~/.cache/ih-sources`, outside the repository. The first lookup for a version takes about
a minute; later ones are instant.

## Using it with Claude Code

1. Open a Claude Code session in the repository root (or a worktree of it). The agent and the skills are picked up from
   `.claude/` automatically. Start a new session after pulling changes to them.
2. Ask for the Captain by name, or run `/agents` to see it:

   ```text
   Ask the identity-captain: why does the connector get an empty presentation from my IdentityHub?
   ```

   Claude also delegates to the Captain on its own when a request matches its description (IdentityHub, IssuerService,
   DCP, DIDs, credentials, charts, settings, upgrades, debugging, extensions).
3. Skills are loaded when a task matches their description. You can also name one explicitly:

   ```text
   Use the breaking-change-guard skill on my branch and tell me what still needs a migration-guide entry.
   ```

## Using it with GitHub Copilot

- **VS Code (Copilot Chat, agent mode):** open the repository, open the chat, and select **Identity Captain** in the
  agent picker. Reload the window if it does not appear yet. Copilot loads the skills from `.claude/skills/` in agent
  mode.
- **Copilot on github.com (coding agent):** custom agents in `.github/agents/` can be selected when you hand a task or
  issue to Copilot. The repository-wide `.github/copilot-instructions.md` also applies to Copilot code review and PR
  descriptions.
- **Without selecting the agent:** because of `.github/copilot-instructions.md`, Copilot still speaks as the Captain and
  follows its ground rules (verify before asserting, cite sources, guard secrets, run `bc-scan.sh` before writing a PR
  description).

## What to ask: example requests

| Goal | Example request | Skill(s) the Captain uses |
|---|---|---|
| Understand a flow | "Explain the DCP issuance flow between holder and issuer, with the classes involved." | `ih-upstream-sources` |
| Find the endpoint | "Which port, path and auth do I use to request a credential for my holder in the compose stack?" | `api-surface` |
| Find a setting | "What is the setting and Helm value for did:web over https, and where is it read?" | `setting-lifecycle` |
| Debug a DID | "`did:web:wallet.example.com:bpnl000000000001` does not resolve for the connector. Why?" | `identity-diagnostics` |
| Debug a token or VP | "Here is the VP the connector rejected; what is wrong with it?" | `identity-diagnostics` |
| Debug issuance | "My credential request stays in REQUESTED. Walk me through it." | `identity-diagnostics`, `dcp-e2e-flow` |
| Prove it end to end | "Run the E2E flow on the sql profile and explain any failure." | `dcp-e2e-flow` |
| Upgrade upstream | "Plan the upgrade from EDC 0.18.0 to 0.19.0: what breaks, which migrations, which collection changes?" | `upstream-edc-bump`, `sql-migration`, `api-surface` |
| Review a PR | "Review PR #339 for breaking changes and missing follow-ups." | `breaking-change-guard` |
| Prepare a release | "Draft the migration-guide section since v0.4.1." | `migration-guide-and-adr` |
| Record a decision | "Write an ADR for enforcing participant ownership on the management APIs." | `migration-guide-and-adr` |
| New feature module | "Scaffold an IdentityHub extension that audits DID publications." | `new-extension` |
| Schema change | "Upstream added a column to the holder schema; add the migration." | `sql-migration` |
| Dependency hygiene | "I bumped jackson; update DEPENDENCIES like CI." | `dependencies-and-dash` |

Good requests name the **side** (holder IdentityHub or IssuerService), the **deployment** (compose `sql`/`memory`,
Helm chart and version) and paste **evidence** (log excerpt, request, DID, token with secrets removed). The Captain asks
for them when they matter.

## Using the scripts without an AI

Every script is a plain shell script. Run them yourself, in CI, or in a pre-push hook. All print `--help`.

```bash
S=.claude/skills
$S/ih-upstream-sources/scripts/ih-src.sh endpoints credentials              # upstream endpoints at the pinned version
$S/upstream-edc-bump/scripts/bump-impact.sh 0.18.0 0.18.1                    # impact report of an upstream bump
$S/setting-lifecycle/scripts/setting-trace.sh EDC_IAM_DID_WEB_USE_HTTPS
$S/breaking-change-guard/scripts/bc-scan.sh --strict                         # exit 1 on BLOCKER/BREAKING
$S/sql-migration/scripts/migrations.sh status
$S/new-extension/scripts/scaffold-extension.sh extensions/identityhub/foo org.eclipse.tractusx.identityhub.foo FooExtension
$S/dcp-e2e-flow/scripts/dcp-e2e.sh run sql
$S/api-surface/scripts/api-inventory.sh contexts
$S/identity-diagnostics/scripts/did-inspect.sh did:web:example.com:holder --probe
$S/identity-diagnostics/scripts/jwt-inspect.sh token.txt --did-check
$S/dependencies-and-dash/scripts/dash-check.sh --list-only
$S/migration-guide-and-adr/scripts/draft-migration-guide.sh
```

The full catalog is in [`.claude/skills/README.md`](../../../.claude/skills/README.md).

## What the Captain does and does not do

**Does:**
- Opens the code, the upstream sources at the pinned version, specs and standards before it answers, and cites them.
- Says whether behaviour comes from Tractus-X, upstream EDC IdentityHub, a specification or a Catena-X standard.
- Runs the skill scripts to collect facts, then gives a recommendation with the concrete next step: a request, DID
  document fix, config, command, patch or test.
- Speaks in first person, as a calm Starfleet-inspired captain, while code and config stay exact.

**Does not:**
- Change files unless you ask it to implement something. By default it is an advisor.
- Push, open PRs or post comments on its own. You stay in control of everything outward-facing.
- Print or post secrets. Decoded tokens stay out of public issues.
- Replace review. Its output is a proposal. AI-generated contributions carry the AI disclosure header (see the skill
  files) and must be reviewed and verified by the human contributor who submits them.

## Maintaining the Captain

- **Keep both agent files in sync.** `.claude/agents/identity-captain.md` and `.github/agents/identity-captain.agent.md`
  share the same body; only the front matter differs.
- **Add a skill** by following [How the skills work → Writing a new skill](skills.md#writing-a-new-skill). Then list it
  in `.claude/skills/README.md`, in the skill table of both agent files, and in `.github/copilot-instructions.md`.
- **License headers:** AI-generated files carry the Apache-2.0 header with the AI disclosure block (AI-generated portions
  under CC0-1.0, `SPDX-License-Identifier: Apache-2.0 AND CC0-1.0`, `Assisted-By:`). Images are covered by
  `.github/agents/REUSE.toml`.
- **Posting on GitHub as the Captain:** use [`comment-template.md`](comment-template.md).
- **After an upstream bump**, re-run the skill scripts once against the new version. They read the version from
  `gradle/libs.versions.toml`, so they normally need no change.
- **Avatar:** the current emblem is a generated placeholder (shield, verification check, four rank pips). It can be
  replaced by any CC-BY-4.0 image with the same file names and sizes.

## Troubleshooting

| Symptom | Fix |
|---|---|
| The Captain or a skill does not show up | Start a new Claude Code session, or reload the VS Code window, after pulling. Check that the files are on your branch. |
| `ih-src: could not resolve any artifact` | Network access to Maven Central is needed the first time per version; or run `./gradlew compileJava` and use `IH_SRC_OFFLINE=1`. |
| First upstream lookup is slow | Sources are downloaded once per version into `~/.cache/ih-sources`. |
| `dcp-e2e: Docker is not running` | Start Docker. `dcp-e2e.sh folders` works without it. |
| `dash-check.sh` cannot reach the internet | Use `--list-only` for the coordinates diff; the Dash run needs `repo.eclipse.org` and the Eclipse/ClearlyDefined APIs. |
| An answer cites nothing | Ask it to show the evidence. Its rules forbid unverified claims, and it should say "I could not find X" rather than guess. |

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- AI Disclosure: This file was entirely AI-generated. The AI-generated portions are made available under CC0-1.0 and
  not subject to the project's license. The human contributor has reviewed and verified that the content is correct.
- SPDX-License-Identifier: CC-BY-4.0 AND CC0-1.0
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Assisted-By: Claude Code (claude-opus-5-5)
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
