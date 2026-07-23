# inference-client

This package provides the shared inference client abstraction for `inference-lab`.
It owns the typed request and response contracts for Ollama and exposes the client implementation used by the CLI and
benchmark runner.

## Responsibility

- define the inference client interface
- define the request and response types
- implement the Ollama transport
- surface transport and API errors in a predictable way

## Public API

The package exports its types and client implementation from `src/index.ts` so other workspace packages can consume it
without reaching into internal files.

## Workspace Relationship

`apps/cli` and `packages/benchmark` depend on this package. It is intentionally isolated so a future runtime adapter
can be added without changing the rest of the workspace.
