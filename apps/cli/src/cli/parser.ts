import { DEFAULT_OLLAMA_MODEL } from '@inference-lab/inference-client';

import type {
  BenchmarkCommandArgs,
  CliCommand,
  CompareCommandArgs,
  ExportCommandArgs,
  ParsedCliInput,
  ReportCommandArgs,
} from './types.ts';

const COMMANDS: ReadonlySet<CliCommand> = new Set([
  'benchmark',
  'compare',
  'dev',
  'export',
  'help',
  'report',
  'stats',
]);

function parseNumber(value: string | undefined, flag: string, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid value for ${flag}.`);
  }

  return parsed;
}

function parseCommaSeparatedList(value: string | undefined, flag: string): string[] {
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseCommonFlags(args: string[]): {
  help: boolean;
  model?: string;
  maxTokens?: number;
  models?: string[];
  output?: string;
  prompt?: string | null;
  runs: number;
  stream: boolean;
  warmup: number;
  format?: 'csv' | 'json';
} {
  let help = false;
  let model: string | undefined;
  let maxTokens: number | undefined;
  let models: string[] | undefined;
  let output: string | undefined;
  let prompt: string | null = null;
  let runs = 1;
  let stream = false;
  let warmup = 0;
  let format: 'csv' | 'json' | undefined;
  let collectingPrompt = false;
  const promptParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }

    if (collectingPrompt && !arg.startsWith('--')) {
      promptParts.push(arg);
      prompt = promptParts.join(' ');
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }

    if (arg === '--stream') {
      stream = true;
      continue;
    }

    if (arg === '--benchmark') {
      continue;
    }

    if (arg === '--model') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --model.');
      }
      model = value;
      index += 1;
      continue;
    }

    if (arg === '--max-tokens') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --max-tokens.');
      }
      maxTokens = parseNumber(value, '--max-tokens', 0);
      index += 1;
      continue;
    }

    if (arg.startsWith('--max-tokens=')) {
      maxTokens = parseNumber(arg.slice('--max-tokens='.length), '--max-tokens', 0);
      continue;
    }

    if (arg.startsWith('--model=')) {
      const value = arg.slice('--model='.length);
      if (!value) {
        throw new Error('Missing value for --model.');
      }
      model = value;
      continue;
    }

    if (arg === '--models') {
      models = parseCommaSeparatedList(args[index + 1], '--models');
      index += 1;
      continue;
    }

    if (arg.startsWith('--models=')) {
      models = parseCommaSeparatedList(arg.slice('--models='.length), '--models');
      continue;
    }

    if (arg === '--prompt') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --prompt.');
      }
      collectingPrompt = true;
      promptParts.length = 0;
      promptParts.push(value);
      prompt = promptParts.join(' ');
      index += 1;
      continue;
    }

    if (arg.startsWith('--prompt=')) {
      const value = arg.slice('--prompt='.length);
      if (!value) {
        throw new Error('Missing value for --prompt.');
      }
      collectingPrompt = true;
      promptParts.length = 0;
      promptParts.push(value);
      prompt = promptParts.join(' ');
      continue;
    }

    if (arg === '--runs') {
      runs = parseNumber(args[index + 1], '--runs', 1);
      index += 1;
      continue;
    }

    if (arg.startsWith('--runs=')) {
      runs = parseNumber(arg.slice('--runs='.length), '--runs', 1);
      continue;
    }

    if (arg === '--warmup') {
      warmup = parseNumber(args[index + 1], '--warmup', 0);
      index += 1;
      continue;
    }

    if (arg.startsWith('--warmup=')) {
      warmup = parseNumber(arg.slice('--warmup='.length), '--warmup', 0);
      continue;
    }

    if (arg === '--format') {
      const value = args[index + 1];
      if (value !== 'csv' && value !== 'json') {
        throw new Error('Unsupported value for --format. Expected csv or json.');
      }
      format = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--format=')) {
      const value = arg.slice('--format='.length);
      if (value !== 'csv' && value !== 'json') {
        throw new Error('Unsupported value for --format. Expected csv or json.');
      }
      format = value;
      continue;
    }

    if (arg === '--output') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --output.');
      }
      output = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length);
      if (!value) {
        throw new Error('Missing value for --output.');
      }
      output = value;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    promptParts.push(arg);
    prompt = promptParts.join(' ');
  }

  const result: {
    format?: 'csv' | 'json';
    help: boolean;
    model?: string;
    maxTokens?: number;
    models?: string[];
    output?: string;
    prompt?: string | null;
    runs: number;
    stream: boolean;
    warmup: number;
  } = {
    help,
    runs,
    stream,
    warmup,
  };

  if (format) {
    result.format = format;
  }

  if (model) {
    result.model = model;
  }

  if (maxTokens !== undefined) {
    result.maxTokens = maxTokens;
  }

  if (models) {
    result.models = models;
  }

  if (output) {
    result.output = output;
  }

  if (prompt !== null) {
    result.prompt = prompt;
  }

  return result;
}

export function parseCliInput(args: string[]): ParsedCliInput {
  const firstNonFlag = args.find((arg) => !arg.startsWith('-'));
  if (firstNonFlag && COMMANDS.has(firstNonFlag as CliCommand)) {
    return {
      command: firstNonFlag as CliCommand,
      rawArgs: args.slice(args.indexOf(firstNonFlag) + 1),
    };
  }

  const hasLegacyBenchmarkFlags = args.some(
    (arg) => arg === '--benchmark' || arg === '--prompt' || arg.startsWith('--prompt='),
  );

  if (hasLegacyBenchmarkFlags) {
    return { command: 'benchmark', rawArgs: args };
  }

  return { command: 'dev', rawArgs: args };
}

export function parseBenchmarkArgs(args: string[]): BenchmarkCommandArgs {
  const parsed = parseCommonFlags(args);
  const result: BenchmarkCommandArgs = {
    benchmark: true,
    help: parsed.help,
    maxTokens: parsed.maxTokens ?? null,
    model: parsed.model ?? DEFAULT_OLLAMA_MODEL,
    prompt: parsed.prompt ?? null,
    runs: parsed.runs,
    stream: parsed.stream,
    warmup: parsed.warmup,
  };

  return result;
}

export function parseCompareArgs(args: string[]): CompareCommandArgs {
  const parsed = parseCommonFlags(args);
  const result: CompareCommandArgs = {
    help: parsed.help,
    models: [],
    maxTokens: parsed.maxTokens ?? null,
    prompt: parsed.prompt ?? null,
    runs: parsed.runs,
    stream: parsed.stream,
    warmup: parsed.warmup,
  };

  if (parsed.models) {
    result.models = parsed.models;
  }

  return result;
}

export function parseExportArgs(args: string[]): ExportCommandArgs {
  const parsed = parseCommonFlags(args);
  const result: ExportCommandArgs = {
    help: parsed.help,
    format: 'json',
  };

  if (parsed.format) {
    result.format = parsed.format;
  }

  return result;
}

export function parseReportArgs(args: string[]): ReportCommandArgs {
  const parsed = parseCommonFlags(args);
  const result: ReportCommandArgs = {
    help: parsed.help,
    output: 'benchmark-report.md',
  };

  if (parsed.output) {
    result.output = parsed.output;
  }

  return result;
}
