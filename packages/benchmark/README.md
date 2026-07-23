# benchmark

This package orchestrates benchmark runs for `inference-lab`.
It coordinates inference, metrics collection, and persistence while keeping the CLI thin.

## Responsibility

- execute normal and streaming runs
- collect timing and token metrics
- build benchmark summaries
- hand completed runs to the storage layer

## Public API

The package exports its runner and supporting types from `src/index.ts`.
Consumers should call into the exported entrypoint instead of importing internal files directly.

## Workspace Relationship

This package depends on `inference-client`, `metrics`, and `storage`.
It sits in the middle of the workspace so future entrypoints can reuse the same benchmark workflow.
