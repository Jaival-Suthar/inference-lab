import type { InferenceClient } from '@inference-lab/inference-client';
import { BenchmarkRunner } from '@inference-lab/benchmark';
import type { BenchmarkRun } from '@inference-lab/metrics';
import type { BenchmarkStore } from '@inference-lab/storage';
import { collectGpuTelemetry, type GpuTelemetrySnapshot } from './gpuTelemetry.ts';

interface NoopStore extends BenchmarkStore {
  save(_run: BenchmarkRun): Promise<void>;
}

export interface BenchmarkSessionOptions {
  model: string;
  maxTokens: number | null;
  prompt: string;
  runs: number;
  stream: boolean;
  warmup: number;
}

export interface BenchmarkSessionProgress {
  current: number;
  total: number;
  phase: 'warmup' | 'benchmark';
}

export interface BenchmarkSessionCallbacks {
  onProgress?: (progress: BenchmarkSessionProgress) => void;
  onToken?: (token: string) => void;
}

export interface BenchmarkSessionResult {
  benchmarkRuns: BenchmarkRun[];
  benchmarkTelemetry: Array<GpuTelemetrySnapshot | null>;
  warmupRuns: BenchmarkRun[];
}

function createNoopStore(): NoopStore {
  return {
    async save() {},
  };
}

async function executeSingleRun(
  runner: BenchmarkRunner,
  options: {
    maxTokens: number | null;
    model: string;
    prompt: string;
    stream: boolean;
    onToken?: (token: string) => void;
  },
): Promise<BenchmarkRun> {
  const runOptions = {
    ...(options.maxTokens === null ? {} : { maxTokens: options.maxTokens }),
    model: options.model,
    prompt: options.prompt,
    stream: options.stream,
    ...(options.onToken ? { onToken: options.onToken } : {}),
  };

  const result = await runner.run(runOptions);

  return result.run;
}

export async function runBenchmarkSession(
  client: InferenceClient,
  store: BenchmarkStore,
  options: BenchmarkSessionOptions,
  callbacks: BenchmarkSessionCallbacks = {},
): Promise<BenchmarkSessionResult> {
  const warmupRunner = new BenchmarkRunner({ client, store: createNoopStore() });
  const benchmarkRunner = new BenchmarkRunner({ client, store });
  const warmupRuns: BenchmarkRun[] = [];
  const benchmarkRuns: BenchmarkRun[] = [];
  const benchmarkTelemetry: Array<GpuTelemetrySnapshot | null> = [];

  if (options.warmup < 0) {
    throw new Error('Warmup runs cannot be negative.');
  }

  if (options.runs < 1) {
    throw new Error('Benchmark runs must be at least 1.');
  }

  for (let index = 0; index < options.warmup; index += 1) {
    callbacks.onProgress?.({ current: index + 1, phase: 'warmup', total: options.warmup });
    warmupRuns.push(
      await executeSingleRun(warmupRunner, {
        maxTokens: options.maxTokens,
        model: options.model,
        prompt: options.prompt,
        stream: options.stream,
      }),
    );
  }

  for (let index = 0; index < options.runs; index += 1) {
    callbacks.onProgress?.({ current: index + 1, phase: 'benchmark', total: options.runs });
    benchmarkRuns.push(
      await executeSingleRun(benchmarkRunner, {
        maxTokens: options.maxTokens,
        model: options.model,
        ...(callbacks.onToken ? { onToken: callbacks.onToken } : {}),
        prompt: options.prompt,
        stream: options.stream,
      }),
    );
    benchmarkTelemetry.push(collectGpuTelemetry());
  }

  return { benchmarkRuns, benchmarkTelemetry, warmupRuns };
}
