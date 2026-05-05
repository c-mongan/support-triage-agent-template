---
name: redaction
description: Strip secrets, tokens, raw person properties, private URLs, and internal admin links before saving any triage output to disk or copying into customer-facing text. Use this skill before Phase 3 of the triage workflow, before posting to any channel, and before sharing any saved report outside the immediate operator.
---

# Redaction

Saved triage reports may sit on disk for months. Customer-facing drafts get pasted into Zendesk, GitHub, email, and Slack. Both are easy places to leak secrets, PII, and internal-only links. This skill is the last line of defense.

## Categories

### Always redact

| Category | Examples | Replacement |
|---|---|---|
| API keys / tokens | `Bearer ...`, `phx_...`, `sk_...`, `ph_...`, JWT, AWS keys | `[redacted-token]` |
| Personal API keys | Any `personal_api_key`, `pat-...` | `[redacted-token]` |
| Passwords / secrets | Any field labeled `password`, `secret`, `client_secret` | `[redacted-secret]` |
| Raw person properties | Email, IP, full name, phone, address | `[redacted-pii]` |
| Session replay URLs containing IDs | `/replay/<session-id>` | `/replay/[redacted]` |
| Admin / go links | `go/admin...`, internal `/admin/...` URLs | `[admin link redacted]` |
| Private webhook URLs | Customer-side `https://<random>.ngrok.io/...` | `[redacted-private-url]` |
| Stack traces with user data | Any frame containing PII or tokens | redact the line, keep the file:line |

### Keep

These are safe and often necessary for investigation continuity:

- Public bug-tracker URLs (`https://github.com/OWNER/REPO/issues/N`).
- Public docs URLs.
- Distinct IDs and project IDs (when not customer PII).
- Org names from public issues (already public).
- Error fingerprints / hashes.
- SDK names and version numbers.
- Public dashboard URLs from your own product.

### Customer-facing extra strip

Beyond the always-redact list, the Draft Customer Response must NOT contain:

- Internal tool names (your bug tracker, your data warehouse).
- Raw queries (SQL, GraphQL, or any product-specific query language).
- Internal admin URLs even if `[redacted]`-suffixed — drop the link entirely.
- Reporter names from private tickets — use "the customer" or the org name.
- Any "I checked X internally" framing that reveals tooling.

## Pattern list (regex, copy-pasteable)

```text
(?i)bearer\s+[A-Za-z0-9._\-]{20,}
(?i)\b(sk|pk|ph|phx|phc|rk)_(live|test)?_?[A-Za-z0-9]{16,}
(?i)\bpat-[A-Za-z0-9_\-]{20,}
\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b   # JWT
\bAKIA[0-9A-Z]{16}\b                                                    # AWS access key
[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}                                 # email (case-insensitive)
\b(?:\d{1,3}\.){3}\d{1,3}\b                                             # IPv4
go/admin[A-Za-z0-9_/\-]*                                                # internal admin links
```

These are starting points, not exhaustive. Add patterns for your own product's key shapes.

## Process

1. Generate the report and customer response in full first.
2. Run the patterns above against both files.
3. For each match: replace with the appropriate placeholder, or remove the line if the surrounding sentence is no longer informative.
4. Re-read the customer-facing response with one question in mind: *if this leaked to a public forum, would anything embarrass us or the customer?* If yes, redact further.
5. Write a one-line confirmation in the Evidence Pack: `Redaction pass: <N> replacements made across <files>.`

## When to break the rules

Almost never. Two narrow exceptions:

- Internal admin URLs MAY appear in the **internal-only** Evidence Pack inside the saved triage report, because the support engineer needs to click through. They must still be stripped from any customer-facing text and any chat post.
- A user identifier may stay in the report if both (a) the customer provided it themselves and (b) it appears in the customer response only as "the user with ID X you mentioned". Prefer "the affected user" wording when possible.

If you are unsure, redact. The cost of an over-redacted report is a follow-up question. The cost of a leaked secret is a security incident.
