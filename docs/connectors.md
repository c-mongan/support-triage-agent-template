# Connector Cookbook

The triage agent is useful with zero MCPs (it can still use `gh`, `WebSearch`, `WebFetch`, and the local docs you bring). It gets sharper as you connect real sources. This file is a starting point, not a contract — every connector is optional.

Copy `.mcp.json.example` to `.mcp.json` and keep only the servers you use. Then mirror the shape in `.claude/settings.json` — list the specific tool names you want allowed (read-only) and explicitly deny mutate verbs.

## What to plug in, by purpose

| Need | Pick one (or more) | Notes |
|---|---|---|
| Bug tracker | GitHub MCP, `gh` CLI, Linear MCP, Jira MCP | At least one is required for the Known-Issue Search Gate. `gh` CLI is the simplest. |
| Product docs | Your docs MCP (if you have one), or `gh` against your docs repo, or `WebFetch` | The agent fetches docs live; never relies on training memory. |
| Framework / SDK docs | Context7 | Helps when the issue is at the customer's stack boundary (Next.js, Flutter, Django, etc.). |
| Codebase Q&A | DeepWiki | For "how does X work internally?" on public repos. |
| Customer project data | Your product's own MCP | Optional but powerful. Without it the agent asks the customer to verify what it cannot check. |
| Error monitor | Sentry MCP, Bugsnag, Rollbar | Confirm a reported exception fingerprint, find the introducing release, count occurrences. |
| Past tickets | Zendesk MCP, Front MCP, Help Scout | Cross-check whether the same customer or org has hit this before. |
| Internal context | Slack MCP (read-only) | Search past triage threads for prior decisions on the same symptom. |

## Wiring patterns

### Read-only is mandatory

In every connector, deny mutate scopes at the settings level even if the MCP server exposes them. Common scopes to deny up front:

- GitHub: `create_issue`, `update_issue`, `add_issue_comment`, `create_pull_request`, `merge_pull_request`.
- Linear: `create_issue`, `update_issue`.
- Sentry: `resolve_issue`, `update_issue`, `assign_issue`.
- Slack: `post_message`, `update_message`, `delete_message`.
- Zendesk: any `tickets-create`, `tickets-update`, `users-update`.

The shipped `.claude/settings.json` denies these by default. If you remove a deny line, you are telling the agent it can write to that system. Be explicit.

### Project pinning when product-data MCP is connected

If you connect a product-data MCP that scopes per-org or per-project (most do), pin a default org/project in `.env` and reference it in the agent definition's "Operating Principles" section:

```text
ASSUMING: PROJECT_ID=<id>, REGION=<region>, PLAN=<tier>.
```

Cross-project queries are easy to do by accident and are usually a privacy bug. Pinning catches it.

### Dual-region products

If your product has EU and US regions, configure both servers but only query one per ticket — the ticket's evidence (admin URL, project ID, user-provided region) decides. The agent definition already has guidance for this; copy-paste from there into your fork.

### Fallback chain

Every connector can fail. The agent's graceful-degradation table covers the common ones: project-data unavailable, bug-tracker rate-limited, codebase Q&A returning "repo not found". A typical fallback chain looks like:

1. Product-data MCP (best — direct evidence).
2. Public bug tracker (`gh` CLI is rarely down).
3. Live docs via `WebFetch`.
4. Customer-side verification asks in the response draft (always works).

## Worked example: GitHub-only triage

The minimum viable wiring is `gh` CLI plus Context7. With those two, the agent can:

- Fan out hybrid + lexical + exact + recent searches against any public repo.
- Read PR diffs for fix-status confirmation.
- Pull live framework docs to ground claims about Next.js / Remix / Flutter / Django behavior.

```bash
# Required
gh auth login

# Optional but recommended
brew install jq

# Confirm
gh api '/search/issues?q=repo:OWNER/REPO+memory+leak&search_type=hybrid&per_page=5' --jq '.items[] | {number,title,state,html_url}'
```

If you stop here, the agent still produces a grounded triage report — the Evidence Pack will simply lean on public bug history and docs instead of project data.

## Worked example: full support stack

The fullest setup connects:

- `gh` CLI + GitHub MCP for issue/PR depth.
- Context7 for framework docs.
- DeepWiki for codebase internals on the product repo.
- Your product's MCP for project data.
- Sentry MCP for error fingerprints.
- Zendesk (or your help-desk) MCP for the customer's history with you.
- Slack MCP for internal prior-context search.

In this configuration the agent can usually reach `Confirmed by data` without any human-side verification, especially for known regressions.

## Data governance reminder

Every connector you wire is a new data flow into the LLM provider. Before connecting a server that touches real customer data:

- Confirm your provider's DPA covers the data class.
- Prefer ZDR routing or in-boundary deployment (Bedrock / Vertex / equivalent).
- Scope MCP credentials per engineer with audit logging.
- Document the connector list in your security handbook.

For demos, evals, and external-facing portfolio runs, comment out the product-data MCP. The agent still works with public-only sources and is a reasonable demo of the workflow.
