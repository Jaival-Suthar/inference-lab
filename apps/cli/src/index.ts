import {
  DEFAULT_OLLAMA_MODEL,
  OllamaClient,
} from '../../../packages/inference-client/src/index.ts';

const EXIT_SUCCESS = 0;
const EXIT_USAGE_ERROR = 64;
const EXIT_RUNTIME_ERROR = 1;

interface CliOptions {
  help: boolean;
  model: string;
  prompt: string | null;
}

function printUsage(): void {
  console.log('Usage: pnpm dev --prompt "Your prompt" [--model qwen3:8b]');
}

function parseArgs(args: string[]): CliOptions {
  let model = DEFAULT_OLLAMA_MODEL;
  let prompt: string | null = null;
  let help = false;
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

    if (arg === '--model') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --model.');
      }
      model = value;
      index += 1;
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

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { help, model, prompt };
}

async function main(): Promise<number> {
  let options: CliOptions;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Failed to parse arguments.');
    printUsage();
    return EXIT_USAGE_ERROR;
  }

  if (options.help) {
    printUsage();
    return EXIT_SUCCESS;
  }

  if (!options.prompt?.trim()) {
    console.error('Missing required --prompt value.');
    printUsage();
    return EXIT_USAGE_ERROR;
  }

  const client = new OllamaClient();

  try {
    const result = await client.generate({
      model: options.model,
      prompt: options.prompt,
    });

    process.stdout.write(`${result.response}\n`);
    return EXIT_SUCCESS;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected failure while calling Ollama.';
    console.error(message);
    return EXIT_RUNTIME_ERROR;
  }
}

process.exitCode = await main();
