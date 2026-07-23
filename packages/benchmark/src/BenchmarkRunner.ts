import type { InferenceClient } from '@inference-lab/inference-client';
import type { BenchmarkRun } from '@inference-lab/metrics';
import type { BenchmarkStore } from '@inference-lab/storage';

import type { BenchmarkExecutionOptions, BenchmarkExecutionResult } from './types.ts';

export interface BenchmarkRunnerOptions {
  client: InferenceClient;
  store: BenchmarkStore;
}

function sumTokenCount(
  promptTokenCount: number | null,
  completionTokenCount: number | null,
): number {
  return (promptTokenCount ?? 0) + (completionTokenCount ?? 0);
}

function calculateTokensPerSecond(
  completionTokenCount: number | null,
  completionDurationMs: number,
): number {
  if (!completionTokenCount || completionDurationMs <= 0) {
    return 0;
  }

  return completionTokenCount / (completionDurationMs / 1000);
}

export class BenchmarkRunner {
  private readonly client: InferenceClient;
  private readonly store: BenchmarkStore;

  public constructor(options: BenchmarkRunnerOptions) {
    this.client = options.client;
    this.store = options.store;
  }

  public async run(
    options: BenchmarkExecutionOptions & { onToken?: (chunk: string) => void },
  ): Promise<BenchmarkExecutionResult> {
    const request = {
      ...(options.model === undefined ? {} : { model: options.model }),
      ...(options.maxTokens === undefined ? {} : { maxTokens: options.maxTokens }),
      prompt: options.prompt,
    };
    const startedAt = Date.now();
    let firstTokenAt: number | null = null;
    let finalResponse: BenchmarkRun | null = null;
    let response = '';

    if (options.stream) {
      for await (const chunk of this.client.streamGenerate(request)) {
        if (chunk.response.length > 0) {
          if (firstTokenAt === null) {
            firstTokenAt = Date.now();
          }

          response += chunk.response;
          options.onToken?.(chunk.response);
        }

        finalResponse = {
          completionDurationMs: 0,
          completionTokenCount: chunk.evalCount ?? null,
          latencyMs: 0,
          model: chunk.model,
          prompt: options.prompt,
          promptTokenCount: chunk.promptEvalCount ?? null,
          response,
          timestamp: chunk.createdAt ?? new Date().toISOString(),
          timeToFirstTokenMs: null,
          tokensPerSecond: 0,
          totalTokenCount: 0,
        };

        if (chunk.done) {
          break;
        }
      }
    } else {
      const result = await this.client.generate(request);

      response = result.response;
      finalResponse = {
        completionDurationMs: 0,
        completionTokenCount: result.evalCount ?? null,
        latencyMs: 0,
        model: result.model,
        prompt: options.prompt,
        promptTokenCount: result.promptEvalCount ?? null,
        response,
        timestamp: result.createdAt ?? new Date().toISOString(),
        timeToFirstTokenMs: null,
        tokensPerSecond: 0,
        totalTokenCount: 0,
      };
    }

    const finishedAt = Date.now();

    if (!finalResponse) {
      throw new Error('Benchmark did not produce a response.');
    }

    const latencyMs = finishedAt - startedAt;
    const completionDurationMs =
      options.stream && firstTokenAt !== null ? finishedAt - firstTokenAt : latencyMs;
    const timeToFirstTokenMs =
      options.stream && firstTokenAt !== null ? firstTokenAt - startedAt : null;
    const promptTokenCount = finalResponse.promptTokenCount;
    const completionTokenCount = finalResponse.completionTokenCount;
    const totalTokenCount = sumTokenCount(promptTokenCount, completionTokenCount);
    const tokensPerSecond = calculateTokensPerSecond(completionTokenCount, completionDurationMs);

    const run: BenchmarkRun = {
      completionDurationMs,
      completionTokenCount,
      latencyMs,
      model: finalResponse.model,
      prompt: options.prompt,
      promptTokenCount,
      response,
      timestamp: finalResponse.timestamp,
      timeToFirstTokenMs,
      tokensPerSecond,
      totalTokenCount,
    };

    await this.store.save(run);

    return { response, run };
  }
}
