import type { SqliteBenchmarkStore } from '@inference-lab/storage';

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export async function exportBenchmarkRuns(
  store: SqliteBenchmarkStore,
  format: 'csv' | 'json',
): Promise<string> {
  const runs = await store.listRuns();

  if (format === 'json') {
    return `${JSON.stringify(runs, null, 2)}\n`;
  }

  const header = [
    'id',
    'timestamp',
    'model',
    'prompt',
    'response',
    'latencyMs',
    'timeToFirstTokenMs',
    'completionDurationMs',
    'promptTokenCount',
    'completionTokenCount',
    'totalTokenCount',
    'tokensPerSecond',
  ];

  const lines = [
    header.join(','),
    ...runs.map((run) =>
      [
        run.id,
        escapeCsv(run.timestamp),
        escapeCsv(run.model),
        escapeCsv(run.prompt),
        escapeCsv(run.response),
        run.latencyMs,
        run.timeToFirstTokenMs ?? '',
        run.completionDurationMs,
        run.promptTokenCount ?? '',
        run.completionTokenCount ?? '',
        run.totalTokenCount,
        run.tokensPerSecond,
      ].join(','),
    ),
  ];

  return `${lines.join('\n')}\n`;
}
