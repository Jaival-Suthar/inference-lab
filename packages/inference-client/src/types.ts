export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'qwen3:8b';

export interface GenerateRequest {
  model?: string;
  prompt: string;
}

export interface GenerateResponse {
  context?: number[];
  createdAt?: string;
  done: boolean;
  doneReason?: string;
  evalCount?: number;
  evalDuration?: number;
  loadDuration?: number;
  model: string;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  response: string;
  totalDuration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: false;
}

export interface OllamaGenerateResponse {
  context?: number[];
  created_at?: string;
  done: boolean;
  done_reason?: string;
  eval_count?: number;
  eval_duration?: number;
  error?: string;
  load_duration?: number;
  model: string;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  response: string;
  total_duration?: number;
}

export interface OllamaErrorResponse {
  error: string;
}
