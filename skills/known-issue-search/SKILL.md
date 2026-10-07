---
name: known-issue-search
description: Search bug trackers, release notes, and source history before concluding misconfiguration or expected behavior on any bug-shaped ticket. Use this skill any time a ticket reports something that worked once and now does not, an upload/build that logs success but the product cannot use, UI state that disagrees with stored data, or any silent no-op / dropped / truncated / zero-result outcome that should not happen.
---

# Known-Issue Search

Use this skill for every bug-shaped ticket before saying "expected behavior", "misconfiguration", "not a bug", or "no matching issue". One empty search is never evidence that no bug exists.

## Bug-shape signals

A ticket is bug-shaped if it reports any of:

- A feature worked once and now does not.
- An upload, build, or sync logs success but the product cannot use the result.
- UI state disagrees with stored data.
- Aggregations disagree with raw rows.
- Fresh install or documented setup fails out of the box.
- Customer cites silent no-ops, dropped requests, truncated values, or zero-result states that should not happen.

## Search matrix

Run all four query types. Cite each in the report.

### 1. Hybrid discovery

Catches paraphrased reports that lexical search misses.

```bash
gh api '/search/issues?q=repo:OWNER/REPO+<url-encoded symptom phrases>&search_type=hybrid&per_page=10' \
  --jq '.items[] | {number,title,state,html_url,created_at,updated_at}'
```

If the product has multiple SDK repos, run hybrid against each likely repo in parallel.

### 2. Broad lexical noun search

2–4 short noun / API / log phrases, not the full customer sentence.

```bash
gh search issues '<short phrase>' --repo OWNER/REPO --match title,body \
  --json number,title,state,createdAt,updatedAt,url --limit 20
```

Examples of good phrases: `distinct ID`, `world map`, `displaySurvey`, `stdin`, `Found 0 chunks to upload`, `silent failure`, `symbol set`, `hobby docker compose`.

### 3. Exact surface search

Quoted method names, CLI flags, exact log fragments, visible UI copy.

```bash
gh search issues '"displaySurvey"' --repo OWNER/REPO --match title,body --json number,title,state,url --limit 20
```

### 4. Recent issue sweep

Catches regressions where keywords have not yet stabilized.

```bash
gh search issues '<broad term>' --repo OWNER/REPO --sort updated --limit 20 \
  --json number,title,state,createdAt,updatedAt,url
```

### No shell? Use the search API over GET

The shipped `support-triage-agent` has no shell tool. Run the same queries by fetching the GitHub search API with WebFetch, for example `https://api.github.com/search/issues?q=repo:OWNER/REPO+%22exact+phrase%22&sort=updated&per_page=20`. Unauthenticated search is rate-limited; record a gap rather than retrying more than twice.

### Offline demo: `mock-sources/`

If the working directory contains `mock-sources/issues/`, run all four query types there with Grep: hybrid (synonyms and paraphrases), lexical (short nouns), exact (quoted strings) and recent (compare `updated:` front matter with the ticket timeframe). Cite issues by path, for example `mock-sources/issues/BEACON-142.md`.

## Footguns

- Do not run `gh search issues --state all`. `all` is not a valid state. Omit `--state`, or run open and closed separately.
- An empty over-specific query is a dead end, not a conclusion. Broaden terms.
- If the bug-tracker MCP returns full issue bodies, summarize only sanitized facts in the report — bodies often contain customer-identifying details.
- For source-code citations, use commit-pinned permalinks, not `blob/main`. The blob SHA from the contents API is not a commit SHA — fetch it separately:
  ```bash
  gh api repos/OWNER/REPO/commits/$(gh api repos/OWNER/REPO --jq '.default_branch') --jq '.sha'
  ```

## Cross-repo correlation

When a bug surfaces in one SDK or component, automatically check related repos. Issues often span repositories — a web-SDK bug may have a backend cause; a mobile-SDK bug may also affect another platform. After finding a match in one repo, fire a parallel search in correlated repos and note any cross-repo matches in the evidence.

## Output

```markdown
## Known-Issue Search

| # | Query type | Repo | Query | Best Candidate | Conclusion |
|---|---|---|---|---|---|
| 1 | Hybrid | OWNER/REPO | … | … | match / rejected / no match |
| 2 | Lexical | OWNER/REPO | … | … | match / rejected / no match |
| 3 | Exact | OWNER/REPO | … | … | match / rejected / no match |
| 4 | Recent | OWNER/REPO | … | … | match / rejected / no match |

**Matching issue / release:** …
**Closest rejected candidates:** … (with one-line reasons)
**Search gaps:** … (e.g., MCP unavailable, rate-limited, repo missing)
```

## Confidence judgment

- Exact symptom + matching version range usually supports **Likely** confidence.
- Exact symptom + direct project/customer evidence can support **Confirmed** confidence.
- Similar symptom without version or config verification stays **Suspected** or **Likely** depending on evidence strength.
- Asserting "no match found" without all four query types caps confidence at **Low (40%)**.
