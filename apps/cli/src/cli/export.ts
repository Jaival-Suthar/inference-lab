import type { RuntimeContext } from '../runtime.ts';
import { exportBenchmarkRuns } from '../services/exportService.ts';
import type { ExportCommandArgs } from './types.ts';

const EXIT_SUCCESS = 0;

export async function runExportCommand(
  args: ExportCommandArgs,
  runtime: RuntimeContext,
): Promise<number> {
  process.stdout.write(await exportBenchmarkRuns(runtime.store, args.format));
  return EXIT_SUCCESS;
}
