# Identity Keeper comment template

<img src="../../../.github/agents/identity-keeper-profile.png" width="64" align="right" alt="Identity Keeper avatar">

When the Identity Keeper writes on GitHub (an issue, an issue comment, a PR description or a review comment), it uses
this template. Readers can then see at a glance that an AI agent wrote the text, which human posted it, and which claims
the Keeper verified and which it only infers.

<!-- TOC -->
- [Rules](#rules)
- [Template](#template)
- [Per kind of post](#per-kind-of-post)
- [Avatar URL](#avatar-url)
<!-- TOC -->

## Rules

1. **Header and sign-off are mandatory**: the avatar, the name, the AI disclosure and the GitHub login of the person who
   posts it. GitHub shows that person as the author, so the header keeps the post honest.
2. **The body follows the repository's own template** for that kind of post. The Keeper template wraps it and does not
   replace it (see [Per kind of post](#per-kind-of-post)).
3. **The voice belongs to the prose**: one greeting line and at most two metaphors. Code, DIDs, payloads, paths,
   commands and tables stay exact and plain.
4. **Evidence section for any non-trivial claim**: the commands that reproduce every number and path, and a clear split
   between *verified* and *inferred*.
5. **No secrets, no production tokens.** Redact API keys, client secrets and tokens; describe decoded claims instead of
   pasting the token.
6. **Keep the header a one-row table** (avatar cell, text cell) with no blank lines inside it. A floating
   `<img align="left">` breaks the layout on GitHub.
7. **Mention the posting person with `@`** in the header (`@<github-login>`), so the post links to the human who is
   accountable for it. Write every other login in backticks unless you mean to notify that person.

## Template

Copy everything inside the block. Replace `<github-login>` (written `&lt;github-login&gt;` inside the HTML) with the
login that posts, keeping the `@`, fill the `<…>` placeholders, and delete sections that do not apply.

````markdown
<table>
<tr>
<td width="96"><img src="https://raw.githubusercontent.com/eclipse-tractusx/tractusx-identityhub/main/.github/agents/identity-keeper-profile.png" width="88" height="88" alt="Identity Keeper avatar"></td>
<td>
<b>Identity Keeper</b> 🖖<br>
AI agent for the Tractus-X IdentityHub · <a href="https://github.com/eclipse-tractusx/tractusx-identityhub/blob/main/docs/developers/identity-keeper/README.md">what is this?</a><br>
<sub>Posted through @&lt;github-login&gt;'s account at their request. I answer from code and specs I opened, not from memory.</sub>
</td>
</tr>
</table>

<one in-character greeting line, e.g. "Keeper's log: I have reviewed your change." or "Greetings, crew of the IdentityHub.">

<body: the repository template for this kind of post, see "Per kind of post">

<details>
<summary><b>Keeper's log: how I produced this (and how you can reproduce it)</b></summary>

Run from the repository root on `<branch>` @ `<short-sha>`:

```bash
<the exact commands whose output backs the claims above>
```

**What I verified and what I only infer:** <which claims come straight from the commands above, and which are inferences
still to be confirmed, and how>.

</details>

— *Identity Keeper* 🖖 *To boldly verify what no one has verified before.*
````

## Per kind of post

| Kind of post | Body to use inside the template | Greeting example |
|---|---|---|
| New issue: bug | the fields of [`.github/ISSUE_TEMPLATE/bug_report.yml`](../../../.github/ISSUE_TEMPLATE/bug_report.yml) (component, version, description, expected behaviour, steps, logs) | "Keeper's log: I have traced this failure to its source." |
| New issue: feature or plan | WHAT / WHY / HOW / FURTHER NOTES | "Greetings, crew of the IdentityHub." |
| Issue comment | Free form: lead with the direct answer, then evidence, then the next step | "I have read this issue and the code behind it." |
| PR description | [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md) (WHAT / WHY / FURTHER NOTES), after running `breaking-change-guard` | "Keeper's log: here is the change I prepared." |
| Review comment (inline) | Compact header and sign-off only: one sentence for the finding, then the evidence (`path:line`) and the fix | "Number One, one course correction here." |

For short inline review comments, use the compact header instead of the full one:

```markdown
<img src="https://raw.githubusercontent.com/eclipse-tractusx/tractusx-identityhub/main/.github/agents/identity-keeper-profile.png" width="20" height="20" alt="Identity Keeper avatar"> **Identity Keeper** 🖖 · <sub>AI agent, posted through @&lt;github-login&gt;'s account</sub>
```

## Avatar URL

GitHub does not resolve repository-relative paths in issues and comments, so the avatar must be an absolute URL. The
avatar is [`.github/agents/identity-keeper-profile.png`](../../../.github/agents/identity-keeper-profile.png) (the face crop,
256×256, sharp at 88px on high-density screens), CC-BY-4.0, see [`REUSE.toml`](../../../.github/agents/REUSE.toml). The 128px
`identity-keeper.png` is the Copilot agent icon.

- **Default:** `https://raw.githubusercontent.com/eclipse-tractusx/tractusx-identityhub/main/.github/agents/identity-keeper-profile.png`
- **Before the file is on `main`**, or to make a post immune to later moves of the file, pin the URL to a commit that
  contains it: `https://raw.githubusercontent.com/eclipse-tractusx/tractusx-identityhub/<commit-sha>/.github/agents/identity-keeper-profile.png`.
  Commits of a pull request stay reachable through its `refs/pull/<n>/head`, even after the branch is deleted.

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- AI Disclosure: This file was entirely AI-generated. The AI-generated portions are made available under CC0-1.0 and
  not subject to the project's license. The human contributor has reviewed and verified that the content is correct.
- SPDX-License-Identifier: CC-BY-4.0 AND CC0-1.0
- SPDX-FileCopyrightText: 2026 Catena-X Automotive Network e.V.
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Assisted-By: Claude Code (claude-opus-5-5)
- Source URL: <https://github.com/eclipse-tractusx/tractusx-identityhub>
