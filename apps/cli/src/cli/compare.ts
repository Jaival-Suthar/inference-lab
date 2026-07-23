import type { RuntimeContext } from '../runtime.ts';
import { buildComparisonRows, formatComparisonTable } from '../services/benchmarkSummary.ts';
import { runBenchmarkSession } from '../services/benchmarkService.ts';
import type { CompareCommandArgs } from './types.ts';

const EXIT_SUCCESS = 0;

export async function runCompareCommand(
  args: CompareCommandArgs,
  runtime: RuntimeContext,
): Promise<number> {
  if (args.models.length === 0) {
    throw new Error('Missing required --models value.');
  }

  if (!args.prompt?.trim()) {
    throw new Error('Missing required --prompt value.');
  }

  const modelRuns: Array<{
    model: string;
    runs: Awaited<ReturnType<typeof runBenchmarkSession>>['benchmarkRuns'];
  }> = [];

  for (const model of args.models) {
    process.stdout.write(`Model ${model}\n`);
    const result = await runBenchmarkSession(
      runtime.client,
      runtime.store,
      {
        maxTokens: args.maxTokens,
        model,
        prompt: args.prompt,
        runs: args.runs,
        stream: args.stream,
        warmup: args.warmup,
      },
      {
        onProgress: (progress) => {
          const label = progress.phase === 'warmup' ? 'Warmup' : 'Benchmark';
          process.stdout.write(`${label} (${progress.current}/${progress.total})\n`);
        },
      },
    );

    modelRuns.push({ model, runs: result.benchmarkRuns });
    process.stdout.write('\n');
  }

  const rows = buildComparisonRows(modelRuns).sort(
    (left, right) =>
      (left.averageLatencyMs ?? Number.POSITIVE_INFINITY) -
      (right.averageLatencyMs ?? Number.POSITIVE_INFINITY),
  );
  process.stdout.write(formatComparisonTable(rows));
  process.stdout.write('\n');

  return EXIT_SUCCESS;
}
