import type { GenerateRequest, GenerateResponse, GenerateStreamChunk } from './types.ts';

export interface InferenceClient {
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  streamGenerate(request: GenerateRequest): AsyncIterable<GenerateStreamChunk>;
}
