# Runtime Configuration

`inference-lab` keeps runtime configuration in environment variables so the CLI stays easy to run locally and easy to
configure in automation.

## `OLLAMA_BASE_URL`

Default: `http://localhost:11434`

Use this variable when Ollama is not running on the default host or when you are pointing the CLI at a remote test
instance.

Example:

```bash
OLLAMA_BASE_URL=http://192.168.1.50:11434 pnpm dev --prompt "Explain KV Cache"
```

## Why This Exists

- It makes the default connection target explicit in the repository.
- It keeps local development and automation aligned.
- It documents the one runtime setting that matters before the rest of the configuration surface grows.

The committed [.env.example](../.env.example) file mirrors the default value so new contributors can discover it quickly.
