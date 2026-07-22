import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  type GenerateRequest,
  type GenerateResponse,
  type OllamaGenerateRequest,
  type OllamaGenerateResponse,
} from './types.ts';
import type { InferenceClient } from './InferenceClient.ts';

export class OllamaClientError extends Error {
  public readonly cause?: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
    this.name = new.target.name;
  }
}

export class OllamaNetworkError extends OllamaClientError {}

export class OllamaApiError extends OllamaClientError {
  public readonly status: number;
  public readonly body: unknown;

  public constructor(message: string, status: number, body: unknown, cause?: unknown) {
    super(message, cause);
    this.status = status;
    this.body = body;
  }
}

export class OllamaProtocolError extends OllamaClientError {}

export interface OllamaClientOptions {
  baseUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorMessage(body: unknown): string | null {
  if (!isRecord(body)) {
    return null;
  }

  const error = body.error;
  return typeof error === 'string' && error.trim().length > 0 ? error : null;
}

function isOllamaGenerateResponse(body: unknown): body is OllamaGenerateResponse {
  return (
    isRecord(body) &&
    typeof body.done === 'boolean' &&
    typeof body.model === 'string' &&
    typeof body.response === 'string'
  );
}

function normalizeBaseUrl(baseUrl: string): string {
  return new URL(baseUrl).toString();
}

function mapGenerateResponse(payload: OllamaGenerateResponse): GenerateResponse {
  const result: GenerateResponse = {
    done: payload.done,
    model: payload.model,
    response: payload.response,
  };

  if (payload.context !== undefined) {
    result.context = payload.context;
  }

  if (payload.created_at !== undefined) {
    result.createdAt = payload.created_at;
  }

  if (payload.done_reason !== undefined) {
    result.doneReason = payload.done_reason;
  }

  if (payload.eval_count !== undefined) {
    result.evalCount = payload.eval_count;
  }

  if (payload.eval_duration !== undefined) {
    result.evalDuration = payload.eval_duration;
  }

  if (payload.load_duration !== undefined) {
    result.loadDuration = payload.load_duration;
  }

  if (payload.prompt_eval_count !== undefined) {
    result.promptEvalCount = payload.prompt_eval_count;
  }

  if (payload.prompt_eval_duration !== undefined) {
    result.promptEvalDuration = payload.prompt_eval_duration;
  }

  if (payload.total_duration !== undefined) {
    result.totalDuration = payload.total_duration;
  }

  return result;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class OllamaClient implements InferenceClient {
  private readonly baseUrl: string;

  public constructor(options: OllamaClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL,
    );
  }

  public async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const prompt = request.prompt.trim();
    if (!prompt) {
      throw new OllamaClientError('Prompt cannot be empty.');
    }

    const payload: OllamaGenerateRequest = {
      model: request.model?.trim() || DEFAULT_OLLAMA_MODEL,
      prompt,
      stream: false,
    };

    let response: Response;

    try {
      response = await fetch(new URL('/api/generate', this.baseUrl), {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    } catch (error) {
      throw new OllamaNetworkError('Unable to reach Ollama. Is the server running?', error);
    }

    const body = await readJsonResponse(response);
    const errorMessage = readErrorMessage(body);

    if (!response.ok) {
      throw new OllamaApiError(
        errorMessage ?? `Ollama returned HTTP ${response.status}.`,
        response.status,
        body,
      );
    }

    if (errorMessage) {
      throw new OllamaApiError(errorMessage, response.status, body);
    }

    if (!isOllamaGenerateResponse(body)) {
      throw new OllamaProtocolError('Ollama returned an unexpected response shape.');
    }

    return mapGenerateResponse(body);
  }
}
