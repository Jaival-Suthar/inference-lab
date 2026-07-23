# Contributing

Thanks for helping improve `inference-lab`.
This repository is intentionally small, so contributions should stay focused and easy to review.

## Before You Start

- Read the root [README](README.md).
- Skim the [architecture docs](docs/architecture.md).
- Check the [roadmap](ROADMAP.md) to avoid duplicating planned work.

## Local Workflow

```bash
pnpm install
pnpm format
pnpm lint
pnpm typecheck
```

## Pull Request Expectations

- keep each PR focused on a single logical change
- update documentation when public behavior changes
- include example output when the change affects the CLI
- avoid unrelated refactors

## Commit Style

Use short, descriptive commit messages that match the repository history.

Examples:

- `feat: add CLI help text`
- `docs: clarify benchmark output`
- `chore: update repository metadata`
