import type { SqliteBenchmarkStore } from '@inference-lab/storage';

function formatRunLine(label: string, value: string): string {
  return `- ${label}: ${value}`;
}

function formatMilliseconds(value: number | null): string {
  return value === null ? 'N/A' : `${(value / 1000).toFixed(2)} s`;
}

function formatTokensPerSecond(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)} tok/s`;
}

function formatRunSummary(run: {
  model: string;
  latencyMs: number;
  tokensPerSecond: number;
}): string {
  return `${run.model} (${formatMilliseconds(run.latencyMs)}, ${formatTokensPerSecond(run.tokensPerSecond)})`;
}

export async function buildMarkdownReport(store: SqliteBenchmarkStore): Promise<string> {
  const statistics = await store.getStatistics();
  const byModel = await store.listModelStatistics();
  const recentRuns = await store.listRecentRuns(10);

  const lines = [
    '# Benchmark Report',
    '',
    '## Overview',
    formatRunLine('Total benchmark runs', String(statistics.benchmarkRunCount)),
    formatRunLine('Average latency', formatMilliseconds(statistics.averageLatencyMs)),
    formatRunLine('Average throughput', formatTokensPerSecond(statistics.averageTokensPerSecond)),
    '',
    '## Models Tested',
    ...byModel.map((row) => `- ${row.model} (${row.runCount})`),
    '',
    '## Average Latency Per Model',
    ...byModel.map((row) => formatRunLine(row.model, formatMilliseconds(row.averageLatencyMs))),
    '',
    '## Average TTFT',
    ...byModel.map((row) =>
      formatRunLine(row.model, formatMilliseconds(row.averageTimeToFirstTokenMs)),
    ),
    '',
    '## Average Throughput',
    ...byModel.map((row) =>
      formatRunLine(row.model, formatTokensPerSecond(row.averageTokensPerSecond)),
    ),
    '',
    '## Fastest Run',
    statistics.fastestRun ? formatRunSummary(statistics.fastestRun) : 'No runs recorded.',
    '',
    '## Slowest Run',
    statistics.slowestRun ? formatRunSummary(statistics.slowestRun) : 'No runs recorded.',
    '',
    '## Best Throughput',
    statistics.bestThroughputRun
      ? formatRunSummary(statistics.bestThroughputRun)
      : 'No runs recorded.',
    '',
    '## Recent Benchmark History',
    ...(recentRuns.length > 0
      ? recentRuns.map(
          (run) =>
            `- ${run.timestamp} | ${run.model} | ${formatMilliseconds(run.latencyMs)} | ${formatTokensPerSecond(run.tokensPerSecond)}`,
        )
      : ['- No runs recorded.']),
    '',
  ];

  return lines.join('\n');
}
