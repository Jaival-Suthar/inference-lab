export interface BaseCommandArgs {
  help: boolean;
}

export interface BenchmarkCommandArgs extends BaseCommandArgs {
  benchmark: boolean;
  maxTokens: number | null;
  model: string;
  prompt: string | null;
  runs: number;
  stream: boolean;
  warmup: number;
}

export interface CompareCommandArgs extends BaseCommandArgs {
  models: string[];
  maxTokens: number | null;
  prompt: string | null;
  runs: number;
  stream: boolean;
  warmup: number;
}

export interface ExportCommandArgs extends BaseCommandArgs {
  format: 'csv' | 'json';
}

export interface ReportCommandArgs extends BaseCommandArgs {
  output: string;
}

export type CliCommand = 'benchmark' | 'compare' | 'dev' | 'export' | 'help' | 'report' | 'stats';

export interface ParsedCliInput {
  command: CliCommand;
  rawArgs: string[];
}
