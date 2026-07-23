import type { BenchmarkRun } from './types.ts';

export interface BenchmarkSummary {
  averageLatencyMs: number | null;
  averageTimeToFirstTokenMs: number | null;
  averageTokensPerSecond: number | null;
  benchmarkRunCount: number;
  completionTokenCount: number;
  maxLatencyMs: number | null;
  maxTimeToFirstTokenMs: number | null;
  maxTokensPerSecond: number | null;
  medianLatencyMs: number | null;
  minLatencyMs: number | null;
  minTimeToFirstTokenMs: number | null;
  minTokensPerSecond: number | null;
  promptTokenCount: number;
  totalTokenCount: number;
}

export interface ModelComparisonSummary extends BenchmarkSummary {
  model: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    if (lower === undefined || upper === undefined) {
      return null;
    }

    return (lower + upper) / 2;
  }

  return sorted[middle] ?? null;
}

function min(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.min(...values);
}

function max(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function collect(values: Array<number | null>): number[] {
  return values.filter((value): value is number => value !== null);
}

export function summarizeBenchmarkRuns(runs: BenchmarkRun[]): BenchmarkSummary {
  const latencyValues = runs.map((run) => run.latencyMs);
  const ttftValues = collect(runs.map((run) => run.timeToFirstTokenMs));
  const throughputValues = runs.map((run) => run.tokensPerSecond);

  return {
    averageLatencyMs: average(latencyValues),
    averageTimeToFirstTokenMs: average(ttftValues),
    averageTokensPerSecond: average(throughputValues),
    benchmarkRunCount: runs.length,
    completionTokenCount: runs.reduce((sum, run) => sum + (run.completionTokenCount ?? 0), 0),
    maxLatencyMs: max(latencyValues),
    maxTimeToFirstTokenMs: max(ttftValues),
    maxTokensPerSecond: max(throughputValues),
    medianLatencyMs: median(latencyValues),
    minLatencyMs: min(latencyValues),
    minTimeToFirstTokenMs: min(ttftValues),
    minTokensPerSecond: min(throughputValues),
    promptTokenCount: runs.reduce((sum, run) => sum + (run.promptTokenCount ?? 0), 0),
    totalTokenCount: runs.reduce((sum, run) => sum + run.totalTokenCount, 0),
  };
}

export function summarizeModelRuns(model: string, runs: BenchmarkRun[]): ModelComparisonSummary {
  return {
    ...summarizeBenchmarkRuns(runs),
    model,
  };
}

function formatMilliseconds(value: number | null): string {
  return value === null ? 'N/A' : `${(value / 1000).toFixed(2)} s`;
}

function formatTokensPerSecond(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)} tok/s`;
}

function formatTokens(value: number): string {
  return `${value} tokens`;
}

export function formatSingleBenchmarkSummary(run: BenchmarkRun): string {
  return [
    `Model: ${run.model}`,
    `Latency: ${formatMilliseconds(run.latencyMs)}`,
    `Completion: ${formatTokens(run.completionTokenCount ?? 0)}`,
    `Prompt: ${formatTokens(run.promptTokenCount ?? 0)}`,
    `Total: ${formatTokens(run.totalTokenCount)}`,
    `Speed: ${formatTokensPerSecond(run.tokensPerSecond)}`,
    run.timeToFirstTokenMs === null
      ? undefined
      : `Time to first token: ${formatMilliseconds(run.timeToFirstTokenMs)}`,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

export function formatBenchmarkSummary(summary: BenchmarkSummary): string {
  return [
    `Benchmark runs: ${summary.benchmarkRunCount}`,
    `Average latency: ${formatMilliseconds(summary.averageLatencyMs)}`,
    `Median latency: ${formatMilliseconds(summary.medianLatencyMs)}`,
    `Minimum latency: ${formatMilliseconds(summary.minLatencyMs)}`,
    `Maximum latency: ${formatMilliseconds(summary.maxLatencyMs)}`,
    `Average TTFT: ${formatMilliseconds(summary.averageTimeToFirstTokenMs)}`,
    `Minimum TTFT: ${formatMilliseconds(summary.minTimeToFirstTokenMs)}`,
    `Maximum TTFT: ${formatMilliseconds(summary.maxTimeToFirstTokenMs)}`,
    `Average tokens/sec: ${formatTokensPerSecond(summary.averageTokensPerSecond)}`,
    `Minimum tokens/sec: ${formatTokensPerSecond(summary.minTokensPerSecond)}`,
    `Maximum tokens/sec: ${formatTokensPerSecond(summary.maxTokensPerSecond)}`,
    `Prompt token count: ${formatTokens(summary.promptTokenCount)}`,
    `Completion token count: ${formatTokens(summary.completionTokenCount)}`,
    `Total token count: ${formatTokens(summary.totalTokenCount)}`,
  ].join('\n');
}
