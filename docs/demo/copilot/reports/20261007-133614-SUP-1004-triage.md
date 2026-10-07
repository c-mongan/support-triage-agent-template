# 🔴 Triage Report: SUP-1004 — Dashboards blank ("No data") for whole team

ASSUMING: Beacon (mock sources), region NOT stated in ticket (EU suspected from timing), plan unknown, systemic (whole team).
→ Correct me now or I proceed with these.

## 📖 Context for Reviewers
P1 ticket. Customer reports every dashboard tile showing "No data" since the morning of 2026-05-02, with a noon board meeting. Evidence comes only from `mock-sources/` (offline fixtures). No project-data access, so confidence is limited by lack of project data access.

## Issue Summary
All dashboard tiles show "No data" for the whole team. Reported 2026-05-02 08:40 UTC.

## Intake
- Type: Bug / Data (bug-shaped: UI state disagrees with stored data, zero-result state)
- Area: Dashboards (tile rendering)
- Identifiers: SUP-1004; no event names, project IDs or request IDs supplied
- Timeframe: "this morning", ticket sent 2026-05-02 08:40 UTC, ongoing
- Environment: unknown (region, plan, browser not given)
- Repro: open any dashboard, tiles show "No data". Not stated whether insights opened directly also show data.
- Impact: whole team, board meeting at noon
- Missing context: project region (EU vs US); whether the same insight opened directly shows data; project ID; a tile's insight link.

## Evidence Gathered
| # | Source | Query | Finding | Status |
|---|---|---|---|---|
| 1 | mock-sources/status/incidents.md | Read | 2026-05-02 incident "Degraded dashboard loading (EU region)": from 08:10 UTC tiles show "No data" for some EU projects; insights opened directly unaffected; 09:05 UTC unhealthy query-cache node identified, mitigation in progress; status Monitoring; US unaffected | ✅ Verified (fixture) |
| 2 | mock-sources/issues/BEACON-160.md | Read | Open bug, same symptom, EU only, created/updated 2026-05-02 | ✅ Verified (fixture) |
| 3 | Customer region | n/a | Not in ticket | ❌ Unverified |
| 4 | Project data / events | n/a | No project-data tool, no identifiers | ❌ Unverified, tool unavailable |

## 🐛 Known-Issue Search
Repo searched: `mock-sources/issues/` (plus status page).
- Hybrid (paraphrases): "dashboard|No data|blank|tile|ingest" via Grep across all of mock-sources. Hits: BEACON-160, status incident 2026-05-02, plus incidental ingestion hits in BEACON-142 and the 2026-04-11 incident.
- Lexical: same grep covers "dashboard", "tile", "blank".
- Exact: "No data" matched the BEACON-160 title and the status page text.
- Recent: grep of `title|status|updated|created` front matter across all issues. Only BEACON-160 (created 2026-05-02) and BEACON-142 (updated 2026-05-04) are near the ticket date.
- Candidate inspection:
  - BEACON-160: ACCEPTED as plausible match (symptom, date, onset time match). Not confirmed for this customer because region is unknown. Ticket says "all dashboards" while the issue says "intermittently / some".
  - BEACON-142: REJECTED. Safari SDK event-drop, unrelated to dashboard tile rendering across the team.
  - 2026-04-11 delayed ingestion: REJECTED, resolved and 3 weeks earlier.
  - BEACON-097/118/151: unrelated (CSV export, ITP, webhooks).

## 🗺️ How It Works (and Where It Breaks)
Per the status page, dashboard tiles are served through a query cache; insights opened directly bypass the problem. An unhealthy EU query-cache node would cause tiles to render "No data" while underlying data is intact. This is inferred from the incident text; no architecture doc in the fixtures.

## 🎯 Root-Cause Assessment
**Assessment:** Likely the active EU-region query-cache incident (BEACON-160 / status page 2026-05-02), not a customer-side problem.
**Confidence:** Likely based on pattern match
**Reasoning:** Symptom, onset (08:10 UTC, ticket 08:40 UTC) and "whole team" blast radius fit the incident. Region not confirmed, so not Confirmed by data.
**Not explained:** Customer region unknown (a US project would not fit); "all" dashboards vs "some" projects in the incident; no project data checked.

## Recommended Next Action
1. Confirm the project's region (support tooling).
2. If EU: link the ticket to BEACON-160 and the status incident; ask the customer to open a key insight directly as an interim way to see the numbers.
3. If US: treat as a new incident and escalate immediately.

## Escalation Decision
🚨 Conditional. P1 with a noon deadline: notify the on-call engineer for BEACON-160 with this ticket as an affected customer, and escalate as new if region is US. No timeline promises to the customer.

## 🔎 Verify This Report
- Open mock-sources/status/incidents.md (2026-05-02 entry) and mock-sources/issues/BEACON-160.md.
- Check the customer's project region.
- Check whether the insight opened directly shows data.

## 💬 Draft Customer Response
Hello,

Thank you for flagging this, and we understand the time pressure of your meeting.

We are currently tracking an incident on our status page where dashboard tiles show "No data" for some EU-region projects. In that incident, the same insights opened directly are not affected, and engineering is working on a mitigation. We have not yet confirmed that your project is affected by this same incident.

To help us confirm, could you tell us:
1. Which region your project is in (EU or US)?
2. Whether opening one of the insights directly, outside the dashboard, shows data?

If opening an insight directly works, you can use that view in the meantime. Please follow the status page for updates, and an engineer will confirm whether your project is affected.

Kind regards,
Support

--- END OF CUSTOMER-FACING CONTENT ---

## 🔬 Evidence Pack (internal only)
Pre-send spot check: all cited references verified (status page entry and BEACON-160 re-read this session).

Claims:
| Claim | Status |
|---|---|
| Status incident 2026-05-02 EU dashboards "No data" | ✅ Verified |
| BEACON-160 open, EU, investigating | ✅ Verified |
| Insights opened directly unaffected | ✅ Verified (status page) |
| Customer is in EU | ❌ Unverified |
| Root cause is this incident for this customer | ⚠️ Inferred |
| Query-cache mechanism explains tiles | ⚠️ Inferred |

Score: (2*1.0 + 2*0.5) / 5 ≈ 60% scaled by claims listed (3 verified-class vs 2 inferred vs 1 unverified: (3+1)/6 ≈ 67%) → Medium. Root-cause claim is not verified, capped at Medium. Candidate BEACON-160 not ruled out, cap Medium (70%).
Confidence limited by lack of project data access.
Redaction: customer name, no keys or PII saved; none present in ticket beyond the company name, omitted from the customer reply.
Tool gaps: no project-data MCP, no error monitor.
