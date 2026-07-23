export interface BenchmarkRun {
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  latencyMs: number;
  timeToFirstTokenMs: number | null;
  completionDurationMs: number;
  promptTokenCount: number | null;
  completionTokenCount: number | null;
  totalTokenCount: number;
  tokensPerSecond: number;
}
