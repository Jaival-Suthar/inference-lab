import { OllamaClient } from '@inference-lab/inference-client';
import { SqliteBenchmarkStore } from '@inference-lab/storage';

export interface RuntimeContext {
  client: OllamaClient;
  store: SqliteBenchmarkStore;
}

export function createRuntimeContext(): RuntimeContext {
  return {
    client: new OllamaClient(),
    store: new SqliteBenchmarkStore(),
  };
}
