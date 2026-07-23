# metrics

This package holds the reusable measurement types and formatting helpers used across the workspace.

## Responsibility

- define benchmark measurement types
- normalize summary data
- format CLI-friendly output

## Public API

The package exports its metric types and formatting helpers from `src/index.ts`.
It is intentionally small so the same summary logic can be shared by the CLI and any future reporting tools.

## Workspace Relationship

`packages/benchmark` uses this package to keep presentation logic separate from orchestration.
