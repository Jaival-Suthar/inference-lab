# @inference-lab/cli

The CLI app is the public entrypoint for `inference-lab`.
It turns workspace packages into commands that can run local inference, benchmarks, and future reporting workflows from
the terminal.

## Responsibility

- parse command-line arguments
- call the inference client
- print model output
- display benchmark summaries
- exit with the correct status code

## Public Surface

The executable behavior is exposed through the root `pnpm` scripts and the app's `src/index.ts` entrypoint.

Examples:

```bash
pnpm dev --prompt "Explain KV Cache"
pnpm benchmark --stream --prompt "Explain RAG"
```

## Workspace Relationship

This package depends on the workspace packages that implement inference, metrics, and storage.
It intentionally stays thin so the core logic can be shared with future entrypoints.
