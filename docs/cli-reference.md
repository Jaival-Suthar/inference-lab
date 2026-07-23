# CLI Reference

The root `pnpm` scripts are the public entrypoints for the current release.

## Common Commands

### `pnpm dev`

Run a single inference through the terminal.

Examples:

```bash
pnpm dev --prompt "Explain KV Cache"
pnpm dev --model qwen3:8b --prompt "Hello"
```

### `pnpm benchmark`

Run a benchmark, print a summary, and persist the result to SQLite.

Examples:

```bash
pnpm benchmark --prompt "Explain KV Cache"
pnpm benchmark --stream --prompt "Explain RAG"
pnpm benchmark --model qwen3:8b --max-tokens 512 --stream --prompt "Explain KV Cache"
```

### `pnpm compare`

Compare stored benchmark runs.

Example:

```bash
pnpm compare
```

### `pnpm report`

Render a summary report from stored benchmark data.

Example:

```bash
pnpm report
```

### `pnpm export`

Export benchmark data for external analysis.

Example:

```bash
pnpm export
```

### `pnpm stats`

Print stored benchmark statistics.

Example:

```bash
pnpm stats
```

## Notes

- `--prompt` is required for inference commands.
- `--stream` enables live token output.
- `--max-tokens` limits completion length without changing the overall workflow.

For implementation details, see [architecture.md](architecture.md).
