import {
  formatBenchmarkSummary,
  formatSingleBenchmarkSummary,
  summarizeBenchmarkRuns,
  summarizeModelRuns,
  type BenchmarkRun,
  type ModelComparisonSummary,
} from '@inference-lab/metrics';

export { formatSingleBenchmarkSummary };

export function formatBenchmarkSessionSummary(runs: BenchmarkRun[]): string {
  return formatBenchmarkSummary(summarizeBenchmarkRuns(runs));
}

export function buildComparisonRows(
  modelRuns: Array<{ model: string; runs: BenchmarkRun[] }>,
): ModelComparisonSummary[] {
  return modelRuns.map(({ model, runs }) => summarizeModelRuns(model, runs));
}

function formatMs(value: number | null): string {
  return value === null ? 'N/A' : `${(value / 1000).toFixed(2)} s`;
}

function formatTps(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)} tok/s`;
}

export function formatComparisonTable(rows: ModelComparisonSummary[]): string {
  const headers = [
    'Model',
    'Average TTFT',
    'Average Latency',
    'Average Tokens/sec',
    'Prompt Tokens',
    'Completion Tokens',
  ];
  const data = rows.map((row) => [
    row.model,
    formatMs(row.averageTimeToFirstTokenMs),
    formatMs(row.averageLatencyMs),
    formatTps(row.averageTokensPerSecond),
    String(row.promptTokenCount),
    String(row.completionTokenCount),
  ]);

  const widths = headers.map((header, columnIndex) =>
    Math.max(header.length, ...data.map((row) => row[columnIndex]?.length ?? 0)),
  );

  const formatRow = (values: string[]) =>
    values.map((value, index) => value.padEnd(widths[index] ?? value.length)).join(' | ');

  const separator = widths.map((width) => '-'.repeat(width)).join('-|-');

  return [formatRow(headers), separator, ...data.map(formatRow)].join('\n');
}
