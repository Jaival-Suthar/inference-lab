import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  type GenerateRequest,
  type GenerateResponse,
  type GenerateStreamChunk,
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

function mapStreamChunk(payload: OllamaGenerateResponse): GenerateStreamChunk {
  const result: GenerateStreamChunk = {
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

async function* readStreamChunks(
  response: Response,
): AsyncGenerator<GenerateStreamChunk, void, void> {
  const body = response.body;
  if (!body) {
    throw new OllamaProtocolError('Ollama did not return a response body.');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line.length > 0) {
          const parsed = JSON.parse(line) as unknown;

          if (readErrorMessage(parsed)) {
            throw new OllamaApiError(
              readErrorMessage(parsed) ?? 'Ollama returned an error response.',
              response.status,
              parsed,
            );
          }

          if (!isOllamaGenerateResponse(parsed)) {
            throw new OllamaProtocolError('Ollama returned an unexpected streaming chunk.');
          }

          yield mapStreamChunk(parsed);
        }

        newlineIndex = buffer.indexOf('\n');
      }
    }

    const tail = buffer.trim();
    if (tail.length > 0) {
      const parsed = JSON.parse(tail) as unknown;

      if (readErrorMessage(parsed)) {
        throw new OllamaApiError(
          readErrorMessage(parsed) ?? 'Ollama returned an error response.',
          response.status,
          parsed,
        );
      }

      if (!isOllamaGenerateResponse(parsed)) {
        throw new OllamaProtocolError('Ollama returned an unexpected streaming chunk.');
      }

      yield mapStreamChunk(parsed);
    }
  } catch (error) {
    if (error instanceof OllamaClientError) {
      throw error;
    }

    throw new OllamaProtocolError('Failed while reading the Ollama streaming response.', error);
  } finally {
    reader.releaseLock();
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

    if (request.maxTokens !== undefined) {
      payload.options = { num_predict: request.maxTokens };
      payload.think = false;
    }

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

  public async *streamGenerate(request: GenerateRequest): AsyncGenerator<GenerateStreamChunk> {
    const prompt = request.prompt.trim();
    if (!prompt) {
      throw new OllamaClientError('Prompt cannot be empty.');
    }

    const payload: OllamaGenerateRequest = {
      model: request.model?.trim() || DEFAULT_OLLAMA_MODEL,
      prompt,
      stream: true,
    };

    if (request.maxTokens !== undefined) {
      payload.options = { num_predict: request.maxTokens };
      payload.think = false;
    }

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

    if (!response.ok) {
      const body = await readJsonResponse(response);
      const errorMessage = readErrorMessage(body);

      throw new OllamaApiError(
        errorMessage ?? `Ollama returned HTTP ${response.status}.`,
        response.status,
        body,
      );
    }

    for await (const chunk of readStreamChunks(response)) {
      yield chunk;
    }
  }
}
