import type { RuntimeContext } from '../runtime.ts';
import { buildStatsOutput } from '../services/statsService.ts';

const EXIT_SUCCESS = 0;

export async function runStatsCommand(runtime: RuntimeContext): Promise<number> {
  process.stdout.write(await buildStatsOutput(runtime.store));
  return EXIT_SUCCESS;
}
