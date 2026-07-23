import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const benchmarkRuns = sqliteTable('benchmark_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  model: text('model').notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  timeToFirstTokenMs: integer('time_to_first_token_ms'),
  completionDurationMs: integer('completion_duration_ms').notNull(),
  promptTokenCount: integer('prompt_token_count'),
  completionTokenCount: integer('completion_token_count'),
  totalTokenCount: integer('total_token_count').notNull(),
  tokensPerSecond: real('tokens_per_second').notNull(),
});

export const createBenchmarkRunsTableSql = `
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  time_to_first_token_ms INTEGER,
  completion_duration_ms INTEGER NOT NULL,
  prompt_token_count INTEGER,
  completion_token_count INTEGER,
  total_token_count INTEGER NOT NULL,
  tokens_per_second REAL NOT NULL
);
`;
