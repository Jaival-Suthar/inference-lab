# Troubleshooting

## Ollama Is Not Responding

Symptoms:

- the CLI hangs before printing a response
- benchmark runs fail early
- the terminal reports a network or connection error

Fix:

1. Start Ollama with `ollama serve`.
2. Confirm the model exists locally.
3. Check `OLLAMA_BASE_URL` if Ollama is running somewhere other than `http://localhost:11434`.

## Streaming Output Does Not Appear

Symptoms:

- benchmark summaries still print
- the completion is stored
- no live tokens appear in the terminal

Fix:

- make sure `--stream` is present
- verify the model is available locally
- confirm the terminal itself is not buffering output

## Benchmark Database Is Missing

Symptoms:

- runs succeed but no history appears to persist

Fix:

- run the CLI from a writable directory
- check whether `inference-lab.sqlite` was created in the current working directory
- confirm the process has permission to write SQLite files

## Where to Look Next

- [architecture.md](architecture.md)
- [cli-reference.md](cli-reference.md)
- [runtime-configuration.md](runtime-configuration.md)
