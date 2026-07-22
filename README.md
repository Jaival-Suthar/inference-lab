# inference-lab

`inference-lab` is an open-source workspace for exploring local LLM inference with a focus on simple, inspectable, and reproducible tooling.

## Project Vision

Build a lightweight foundation for experimenting with local model runtimes and the surrounding developer workflow without adding unnecessary abstraction.

## Goals

- Keep the stack TypeScript-first and ESM-native.
- Prefer Node.js 22+ and built-in platform capabilities.
- Start with Ollama and leave room for future runtimes.
- Grow into a monorepo without forcing package boundaries too early.
- Keep the codebase small, readable, and easy to extend.

## Repository Structure

- `apps/` - runnable applications, including the future dashboard.
- `packages/` - shared workspace packages.
- `docs/` - project notes and supporting documentation.
- `benchmarks/` - benchmark definitions and experiment outputs when those arrive.
- `scripts/` - helper scripts for local development and maintenance.

## Technology Stack

- TypeScript
- Node.js 22+
- pnpm workspaces
- ESM modules
- Strict TypeScript configuration
- Prettier
- ESLint flat config
- Husky and lint-staged for local workflow checks

## Planned Roadmap

- Local inference client foundation
- Shared metrics and storage packages
- Supporting docs and workflow improvements
- Dashboard-oriented application layer

## Getting Started

1. Install dependencies with `pnpm install`.
2. Check formatting with `pnpm format:check`.
3. Run linting with `pnpm lint`.
4. Run type checking with `pnpm typecheck`.

## Development Workflow

- Use `pnpm format` to rewrite files with Prettier.
- Use `pnpm lint:fix` when you want ESLint to apply fixes.
- Let the pre-commit hook run `lint-staged` on staged files.
- Keep changes small and commit one logical milestone at a time.
