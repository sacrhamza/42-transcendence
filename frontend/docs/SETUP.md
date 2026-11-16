# Setup and build

## Requirements

Use Node.js 22 or later and npm, or pnpm if that is your team's package manager. The frontend uses React 19, JavaScript/JSX, CSS, and Vite 6. Dependency ranges and commands are defined in [package.json](../package.json).

## Run locally

From the repository root:

```sh
cd frontend
npm install
npm run dev
```

Keep the terminal running. Open the URL printed by Vite, normally:

- Login: http://localhost:5173/login
- Signup: http://localhost:5173/signup
- Profile preview: http://localhost:5173/profile

Both development and preview servers bind to `0.0.0.0` (all network interfaces). On this computer, use `localhost`; from another device on the same network, use this computer’s LAN IP and the printed port. `0.0.0.0` is the bind address, not the address to share with teammates.

Vite may choose another port if 5173 is occupied. If the browser reports a refused connection, start the server again and use its printed URL. Each teammate runs the server on their own computer.

The pnpm equivalents are `pnpm install` and `pnpm dev`. The repository includes `pnpm-lock.yaml`; when using pnpm, preserve and commit lockfile changes with dependency changes. Avoid mixing package managers within one installation.

## Build and preview

From `frontend/`:

```sh
npm run build
npm run preview
```

The build writes production files into `dist/`. Preview serves that build locally; open the address printed in the terminal. Rebuild after source changes before checking preview.

## Regression tests

From `frontend/`, run `npm test` after installing dependencies (including development dependencies). The tests use Node's built-in test runner and a simulated IndexedDB database; they do not connect to a backend or modify your browser's data.

## Production hosting

Serve the contents of `dist/`. Configure the server to fall back to `index.html` for frontend routes such as `/signup`, `/profile`, and `/messages/alex`. Static assets and backend API routes need their own handling. This fallback allows direct links and browser refreshes to work without hash URLs.

The existing frontend Dockerfile still uses a placeholder command (`some_command`), and the root Compose file does not currently define a frontend service. The local commands above are the supported workflow until that integration is completed.

## Files to share

Commit `src/`, `public/`, `index.html`, package configuration, the dependency lockfile, `.gitignore`, the README, and `docs/`. Do not commit `node_modules/`, `.pnpm-store/`, `dist/`, or local environment files. Teammates install dependencies after pulling.

Current frontend work is on the `frontend` branch. Check `git status` and the active branch before committing. Publishing changes to GitHub is a separate step from building or running the site.
