# apps

This workspace directory contains runnable applications and thin entrypoints.
The first public release ships only the terminal CLI, but the layout is ready for future apps.

## Current Contents

- [`cli/`](cli/) - the user-facing command-line application.

## Notes

- Keep application code thin and delegate reusable behavior to `packages/`.
- Add a new app here only when it has a user-facing entrypoint.
