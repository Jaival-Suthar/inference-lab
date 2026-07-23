import type { SqliteBenchmarkStore } from '@inference-lab/storage';

function formatMilliseconds(value: number | null): string {
  return value === null ? 'N/A' : `${(value / 1000).toFixed(2)} s`;
}

function formatTokensPerSecond(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)} tok/s`;
}

export async function buildStatsOutput(store: SqliteBenchmarkStore): Promise<string> {
  const statistics = await store.getStatistics();
  const models = await store.listModelStatistics();

  const lines = [
    `Benchmark Runs: ${statistics.benchmarkRunCount}`,
    '',
    'Models:',
    ...(models.length > 0 ? models.map((row) => `- ${row.model} (${row.runCount})`) : ['- None']),
    '',
    `Average latency: ${formatMilliseconds(statistics.averageLatencyMs)}`,
    `Average throughput: ${formatTokensPerSecond(statistics.averageTokensPerSecond)}`,
    '',
    'Most recent benchmark:',
    statistics.mostRecentRun
      ? `${statistics.mostRecentRun.model} | ${formatMilliseconds(statistics.mostRecentRun.latencyMs)} | ${formatTokensPerSecond(statistics.mostRecentRun.tokensPerSecond)}`
      : 'No runs recorded.',
  ];

  return `${lines.join('\n')}\n`;
}
