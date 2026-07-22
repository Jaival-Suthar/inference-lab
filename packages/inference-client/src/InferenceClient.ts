import type { GenerateRequest, GenerateResponse } from './types.ts';

export interface InferenceClient {
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}
