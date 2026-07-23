import type { RuntimeContext } from '../runtime.ts';
import { createRuntimeContext } from '../runtime.ts';

import { runBenchmarkCommand } from './benchmark.ts';
import { runCompareCommand } from './compare.ts';
import { runDevCommand } from './dev.ts';
import { runExportCommand } from './export.ts';
import {
  parseBenchmarkArgs,
  parseCliInput,
  parseCompareArgs,
  parseExportArgs,
  parseReportArgs,
} from './parser.ts';
import { runReportCommand } from './report.ts';
import { runStatsCommand } from './stats.ts';

const EXIT_SUCCESS = 0;
const EXIT_USAGE_ERROR = 64;
const EXIT_RUNTIME_ERROR = 1;

function printUsage(): void {
  process.stdout.write(
    [
      'Usage:',
      '  pnpm benchmark --prompt "Explain KV Cache" [--model qwen3:8b] [--runs 5] [--warmup 1] [--stream] [--max-tokens 512]',
      '  pnpm compare --models qwen3:8b,gemma3:4b --prompt "Explain Transformers" [--runs 3] [--warmup 1]',
      '  pnpm report --output benchmark-report.md',
      '  pnpm export --format csv',
      '  pnpm stats',
      '  pnpm dev',
      '',
    ].join('\n'),
  );
}

function isHelpRequest(args: string[]): boolean {
  return args.includes('--help') || args.includes('-h');
}

async function dispatch(command: string, args: string[], runtime: RuntimeContext): Promise<number> {
  switch (command) {
    case 'benchmark':
      return runBenchmarkCommand(parseBenchmarkArgs(args), runtime);
    case 'compare':
      return runCompareCommand(parseCompareArgs(args), runtime);
    case 'export':
      return runExportCommand(parseExportArgs(args), runtime);
    case 'report':
      return runReportCommand(parseReportArgs(args), runtime);
    case 'stats':
      return runStatsCommand(runtime);
    case 'dev':
      return runDevCommand();
    default:
      printUsage();
      return EXIT_USAGE_ERROR;
  }
}

export async function runCli(argv: string[]): Promise<number> {
  const input = parseCliInput(argv);

  if (isHelpRequest(input.rawArgs) || input.command === 'help') {
    printUsage();
    return EXIT_SUCCESS;
  }

  try {
    const runtime = createRuntimeContext();
    return await dispatch(input.command, input.rawArgs, runtime);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Unexpected CLI failure.'}\n`);
    return EXIT_RUNTIME_ERROR;
  }
}
