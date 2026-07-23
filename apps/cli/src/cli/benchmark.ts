import type { RuntimeContext } from '../runtime.ts';
import {
  formatBenchmarkSessionSummary,
  formatSingleBenchmarkSummary,
} from '../services/benchmarkSummary.ts';
import { runBenchmarkSession } from '../services/benchmarkService.ts';
import { formatGpuTelemetry } from '../services/gpuTelemetry.ts';
import type { BenchmarkCommandArgs } from './types.ts';

const EXIT_SUCCESS = 0;

export async function runBenchmarkCommand(
  args: BenchmarkCommandArgs,
  runtime: RuntimeContext,
): Promise<number> {
  if (!args.prompt?.trim()) {
    throw new Error('Missing required --prompt value.');
  }

  const session = await runBenchmarkSession(
    runtime.client,
    runtime.store,
    {
      model: args.model,
      maxTokens: args.maxTokens,
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
      onToken: (token) => {
        process.stdout.write(token);
      },
    },
  );

  if (session.warmupRuns.length > 0) {
    process.stdout.write('\nWarmup\n');
    session.warmupRuns.forEach((run, index) => {
      process.stdout.write(`Warmup ${index + 1}/${session.warmupRuns.length}\n`);
      process.stdout.write(`${formatSingleBenchmarkSummary(run)}\n`);
    });
  }

  process.stdout.write('\nBenchmark Runs\n');
  session.benchmarkRuns.forEach((run, index) => {
    process.stdout.write(`Benchmark ${index + 1}/${session.benchmarkRuns.length}\n`);
    process.stdout.write(`${formatSingleBenchmarkSummary(run)}\n`);
    process.stdout.write(`${formatGpuTelemetry(session.benchmarkTelemetry[index] ?? null)}\n`);
    process.stdout.write('\n');
  });

  if (session.benchmarkRuns.length > 1) {
    process.stdout.write('Summary\n');
    process.stdout.write(`${formatBenchmarkSessionSummary(session.benchmarkRuns)}\n`);
  }

  return EXIT_SUCCESS;
}
