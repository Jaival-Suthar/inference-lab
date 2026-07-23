import { DatabaseSync } from 'node:sqlite';

import type { BenchmarkRun } from '@inference-lab/metrics';

import { createBenchmarkRunsTableSql } from './schema.ts';

export const DEFAULT_BENCHMARK_DATABASE_FILE = 'inference-lab.sqlite';

export interface BenchmarkRunRecord extends BenchmarkRun {
  id: number;
}

export interface ModelBenchmarkStatistics {
  completionTokenCount: number;
  averageLatencyMs: number;
  averageTimeToFirstTokenMs: number | null;
  averageTokensPerSecond: number;
  model: string;
  promptTokenCount: number;
  runCount: number;
  totalTokenCount: number;
}

export interface DatabaseStatistics {
  averageLatencyMs: number | null;
  averageTokensPerSecond: number | null;
  benchmarkRunCount: number;
  fastestRun: BenchmarkRunRecord | null;
  bestThroughputRun: BenchmarkRunRecord | null;
  mostRecentRun: BenchmarkRunRecord | null;
  slowestRun: BenchmarkRunRecord | null;
}

export interface BenchmarkStore {
  save(run: BenchmarkRun): Promise<void>;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function asNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : asNumber(value);
}

function mapRunRow(row: Record<string, unknown>): BenchmarkRunRecord {
  return {
    completionDurationMs: asNumber(row.completion_duration_ms),
    completionTokenCount: asNullableNumber(row.completion_token_count),
    id: asNumber(row.id),
    latencyMs: asNumber(row.latency_ms),
    model: String(row.model ?? ''),
    prompt: String(row.prompt ?? ''),
    promptTokenCount: asNullableNumber(row.prompt_token_count),
    response: String(row.response ?? ''),
    timestamp: String(row.timestamp ?? ''),
    timeToFirstTokenMs: asNullableNumber(row.time_to_first_token_ms),
    tokensPerSecond: asNumber(row.tokens_per_second),
    totalTokenCount: asNumber(row.total_token_count),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapOptionalRun(row: unknown): BenchmarkRunRecord | null {
  return isRecord(row) ? mapRunRow(row) : null;
}

export class SqliteBenchmarkStore implements BenchmarkStore {
  private readonly database: DatabaseSync;

  public constructor(databaseFile = DEFAULT_BENCHMARK_DATABASE_FILE) {
    this.database = new DatabaseSync(databaseFile, { create: true });
    this.database.exec(createBenchmarkRunsTableSql);
  }

  public async save(run: BenchmarkRun): Promise<void> {
    this.database
      .prepare(
        `
        INSERT INTO benchmark_runs (
          timestamp,
          model,
          prompt,
          response,
          latency_ms,
          time_to_first_token_ms,
          completion_duration_ms,
          prompt_token_count,
          completion_token_count,
          total_token_count,
          tokens_per_second
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        run.timestamp,
        run.model,
        run.prompt,
        run.response,
        run.latencyMs,
        run.timeToFirstTokenMs,
        run.completionDurationMs,
        run.promptTokenCount,
        run.completionTokenCount,
        run.totalTokenCount,
        run.tokensPerSecond,
      );
  }

  public async listRuns(): Promise<BenchmarkRunRecord[]> {
    const rows = this.database
      .prepare('SELECT * FROM benchmark_runs ORDER BY id ASC')
      .all() as Record<string, unknown>[];
    return rows.map(mapRunRow);
  }

  public async listRecentRuns(limit = 10): Promise<BenchmarkRunRecord[]> {
    const rows = this.database
      .prepare('SELECT * FROM benchmark_runs ORDER BY id DESC LIMIT ?')
      .all(limit) as Record<string, unknown>[];
    return rows.map(mapRunRow).reverse();
  }

  public async listModelStatistics(): Promise<ModelBenchmarkStatistics[]> {
    const rows = this.database
      .prepare(
        `
        SELECT
          model,
          COUNT(*) AS run_count,
          AVG(latency_ms) AS average_latency_ms,
          AVG(time_to_first_token_ms) AS average_time_to_first_token_ms,
          AVG(tokens_per_second) AS average_tokens_per_second,
          COALESCE(SUM(prompt_token_count), 0) AS prompt_token_count,
          COALESCE(SUM(completion_token_count), 0) AS completion_token_count,
          COALESCE(SUM(total_token_count), 0) AS total_token_count
        FROM benchmark_runs
        GROUP BY model
        ORDER BY average_latency_ms ASC, model ASC
        `,
      )
      .all() as Record<string, unknown>[];

    return rows.map((row) => ({
      completionTokenCount: asNumber(row.completion_token_count),
      averageLatencyMs: asNumber(row.average_latency_ms),
      averageTimeToFirstTokenMs: asNullableNumber(row.average_time_to_first_token_ms),
      averageTokensPerSecond: asNumber(row.average_tokens_per_second),
      model: String(row.model ?? ''),
      promptTokenCount: asNumber(row.prompt_token_count),
      runCount: asNumber(row.run_count),
      totalTokenCount: asNumber(row.total_token_count),
    }));
  }

  public async getStatistics(): Promise<DatabaseStatistics> {
    const aggregate = this.database
      .prepare(
        `
        SELECT
          COUNT(*) AS benchmark_run_count,
          AVG(latency_ms) AS average_latency_ms,
          AVG(tokens_per_second) AS average_tokens_per_second
        FROM benchmark_runs
        `,
      )
      .get() as Record<string, unknown> | undefined;

    const fastestRun = mapOptionalRun(
      this.database
        .prepare('SELECT * FROM benchmark_runs ORDER BY latency_ms ASC, id ASC LIMIT 1')
        .get(),
    );
    const slowestRun = mapOptionalRun(
      this.database
        .prepare('SELECT * FROM benchmark_runs ORDER BY latency_ms DESC, id DESC LIMIT 1')
        .get(),
    );
    const bestThroughputRun = mapOptionalRun(
      this.database
        .prepare('SELECT * FROM benchmark_runs ORDER BY tokens_per_second DESC, id DESC LIMIT 1')
        .get(),
    );
    const mostRecentRun = mapOptionalRun(
      this.database.prepare('SELECT * FROM benchmark_runs ORDER BY id DESC LIMIT 1').get(),
    );

    return {
      averageLatencyMs: aggregate ? asNullableNumber(aggregate.average_latency_ms) : null,
      averageTokensPerSecond: aggregate
        ? asNullableNumber(aggregate.average_tokens_per_second)
        : null,
      benchmarkRunCount: aggregate ? asNumber(aggregate.benchmark_run_count) : 0,
      fastestRun,
      bestThroughputRun,
      mostRecentRun,
      slowestRun,
    };
  }
}
