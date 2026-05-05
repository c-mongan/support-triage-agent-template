# Architecture

This template separates investigation into five small stages.

```mermaid
flowchart LR
    A["Raw ticket"] --> B["Intake parser"]
    B --> C1["Customer/project data"]
    B --> C2["Docs and runbooks"]
    B --> C3["Known issues"]
    B --> C4["Source/release history"]
    B --> C5["Reproduction/logs"]
    C1 --> D["Evidence synthesis"]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    D --> E["Triage report"]
    E --> F["Customer response"]
    E --> G["Escalation brief"]
```

## Design Choices

- **Read-only first:** support tooling should not mutate production state while investigating.
- **Parallel research:** independent checks should run together so the human gets a head start quickly.
- **Evidence grading:** every conclusion carries a confidence level.
- **Reusable report shape:** consistent reports make it easier to compare issues, spot recurring problems, and measure quality.
- **Domain-specific skills:** the generic workflow stays small, while product-specific diagnosis lives in separate skills.

