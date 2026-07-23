declare module 'node:sqlite' {
  export interface DatabaseSyncOptions {
    create?: boolean;
  }

  export interface StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  }

  export class DatabaseSync {
    public constructor(path: string, options?: DatabaseSyncOptions);
    public exec(sql: string): void;
    public prepare(sql: string): StatementSync;
  }
}
