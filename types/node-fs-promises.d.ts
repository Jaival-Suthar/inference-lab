declare module 'node:fs/promises' {
  export function mkdir(
    path: string,
    options?: { recursive?: boolean },
  ): Promise<string | undefined>;
  export function writeFile(
    path: string,
    data: string,
    options?: { encoding?: string },
  ): Promise<void>;
}
