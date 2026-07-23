# packages

Shared workspace packages live here. Each package is intentionally small and focused so the CLI can reuse the same
building blocks without duplicating logic.

## Packages

- [`benchmark/`](benchmark/) - orchestrates inference runs and metrics collection.
- [`inference-client/`](inference-client/) - talks to Ollama and future runtimes.
- [`metrics/`](metrics/) - defines and formats benchmark measurements.
- [`storage/`](storage/) - persists benchmark runs to SQLite.

## Guidance

- keep package boundaries clear
- prefer workspace dependencies over cross-package duplication
- document the public API in each package README
