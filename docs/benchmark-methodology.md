# Benchmark Methodology

`inference-lab` benchmarks are designed to answer one question: how does a local model behave on this machine for this
prompt and configuration?

## What Gets Recorded

Each run records:

- timestamp
- model
- prompt
- response
- latency
- time to first token, when streaming is enabled
- completion duration
- prompt token count
- completion token count
- total tokens
- tokens per second

## Streaming vs Non-Streaming

- Non-streaming runs measure the full request/response cycle.
- Streaming runs also capture time to first token and emit tokens live in the terminal.

## Reading the Numbers

- `Latency` is the end-to-end wall clock time for the run.
- `TTFT` is only meaningful for streaming runs.
- `Speed` is derived from the completion token count and completion duration.

## Practical Guidance

- Compare runs only when the prompt, model, and hardware are the same.
- Restart Ollama between large environment changes if results look inconsistent.
- Treat the SQLite history as an experiment log, not a distributed analytics system.

The implementation keeps the methodology intentionally simple so it can remain stable as the repository grows.
