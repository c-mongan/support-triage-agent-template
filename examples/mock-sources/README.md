# Mock sources (synthetic, read-only)

Offline stand-ins for the connectors a real deployment would wire up (bug tracker, product docs, release notes, status page). They let the demo and the E2E test run with **no credentials and no network connectors**.

Everything here describes **Beacon**, a fictional product analytics SaaS. No real company, customer or person is represented.

| Folder | Stands in for | How the agent searches it |
|---|---|---|
| `issues/` | Bug tracker (GitHub Issues, Linear, Jira) | Grep over titles, bodies and front matter (`status`, `created`, `updated`, `labels`) |
| `docs/` | Product documentation | Grep / Read |
| `releases/` | Release notes and changelogs | Grep / Read, version-range matching |
| `status/` | Public status page / incident history | Grep / Read, time-window matching |

## Using it

Copy `examples/tickets/` and `examples/mock-sources/` into a working directory (the E2E script does this for you), then run `/triage tickets/<file>.md`. When a `mock-sources/` folder is present in the working directory, the agent treats it as the evidence source for the fictional Beacon product and does not search the web for it.

The search matrix still applies: hybrid (synonyms and paraphrases), lexical (short noun phrases), exact (quoted error strings and method names) and recent (sort by the `updated` front-matter field).

These files are fixtures. The agent must never edit them.
