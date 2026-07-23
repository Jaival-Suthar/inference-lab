CREATE TABLE IF NOT EXISTS benchmark_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  time_to_first_token_ms INTEGER,
  completion_duration_ms INTEGER NOT NULL,
  prompt_token_count INTEGER,
  completion_token_count INTEGER,
  total_token_count INTEGER NOT NULL,
  tokens_per_second REAL NOT NULL
);
