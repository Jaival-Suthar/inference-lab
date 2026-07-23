# storage

This package persists benchmark runs to SQLite through Drizzle ORM.
It is the workspace's durable storage layer for benchmark history.

## Responsibility

- define the SQLite schema
- create and run the initial migration
- store completed benchmark runs
- provide read access for reporting commands

## Public API

The package exports its storage helpers and schema-related types from `src/index.ts`.
Its implementation stays isolated so reporting and persistence can evolve together.

## Workspace Relationship

`packages/benchmark` writes through this package, and the CLI reads the resulting SQLite file from the current working
directory by default.

The default database filename is `inference-lab.sqlite`.
