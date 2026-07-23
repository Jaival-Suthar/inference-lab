import type { BenchmarkRun } from '@inference-lab/metrics';

export interface BenchmarkExecutionOptions {
  model?: string;
  maxTokens?: number;
  prompt: string;
  stream: boolean;
}

export interface BenchmarkExecutionResult {
  response: string;
  run: BenchmarkRun;
}
