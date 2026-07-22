declare const process: {
  argv: string[];
  exitCode?: number;
  env: Record<string, string | undefined>;
  stdout: {
    write(chunk: string): boolean;
  };
  stderr: {
    write(chunk: string): boolean;
  };
};
