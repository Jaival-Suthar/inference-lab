import { mkdir, writeFile } from 'node:fs/promises';

import type { RuntimeContext } from '../runtime.ts';
import { buildMarkdownReport } from '../services/reportService.ts';
import type { ReportCommandArgs } from './types.ts';

const EXIT_SUCCESS = 0;

function getParentDirectory(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index === -1 ? '.' : path.slice(0, index);
}

export async function runReportCommand(
  args: ReportCommandArgs,
  runtime: RuntimeContext,
): Promise<number> {
  const markdown = await buildMarkdownReport(runtime.store);
  await mkdir(getParentDirectory(args.output), { recursive: true });
  await writeFile(args.output, markdown, { encoding: 'utf8' });
  process.stdout.write(`${args.output}\n`);
  return EXIT_SUCCESS;
}
