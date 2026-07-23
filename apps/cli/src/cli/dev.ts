const EXIT_SUCCESS = 0;

export async function runDevCommand(): Promise<number> {
  process.stdout.write(
    'Development environment is not required yet. Use benchmark, compare, report, export, or stats.\n',
  );
  return EXIT_SUCCESS;
}
