# SUF — Stack Under Flow

React frontend for a developer community built around projects, peers, and discussion rooms. Backend services will be implemented by the team.

## Run locally

Install Node.js 22 or later, then open a terminal in this folder:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal. Keep the terminal running while using the preview. Each teammate runs the development server on their own PC.

If you use pnpm, install with `pnpm install` and start with `pnpm dev`. The pnpm lockfile is included.

```sh
npm run build
npm run preview
```

Login is available at `/login` and signup at `/signup`. Internal navigation uses clean paths without `#`. For production hosting, configure the web server to serve `index.html` for frontend routes that do not match a static file; Vite handles this during local development.

The project uses React 19 and Vite 6. Fonts are Inter and JetBrains Mono, with local fallbacks.

## Implemented frontend

- Login and signup forms with validation and password visibility.
- Home feed, search, local posts, likes, comments, saved posts, post menus and pagination (20 posts per page).
- Community projects, tag filters, activity ranking, project creation and README/PDF/text attachments.
- 42 projects category prepared for server-verified 42 students; hidden for ordinary users.
- Own profile with photo, bio, skills, links and an Edit profile popup.
- Project discussion rooms: create, read, join/leave, chat, attachments and code sharing.
- C, JavaScript and C++ snippet editor, standard input and output panel.
- Dark/light themes and responsive layouts.

## Preview limitations

Signup, email verification, and login connect to the authentication backend through the `/api` proxy. Login uses HttpOnly cookies; session restoration, token refresh, and server-side logout are not implemented yet. See [Backend integration](docs/BACKEND-INTEGRATION.md). Some data and activity counts are examples. Posts, projects, rooms, messages and attachments use IndexedDB to survive local refreshes. Theme, saved-post IDs, profile edits and peer relationships use localStorage. If browser storage is unavailable or full, the UI warns that affected changes are temporary. Data is local to this browser and origin, not shared with other users.

The Run snippet button does not compile or execute code. Reports and peer requests are local preview actions. Private messages, peer relationships and public profiles have local preview interfaces. Backend account management, notifications and shared services still need implementation or integration.

42 verification, protected access, persistent uploads, account storage, real-time chat and code execution require backend services. Frontend visibility checks do not enforce access control.

## Source structure

- `src/App.jsx`: browser history routing and theme state.
- `src/pages/`: Login, Home, Projects and Profile views.
- `src/components/`: shared UI, posts, code blocks and discussion rooms.
- `src/data/`: illustrative project, post and room data.
- `src/utils/storage.js`: guarded localStorage.
- `src/utils/browserDatabase.js` and `src/hooks/useBrowserState.js`: transactional IndexedDB state and attachment URL restoration.
- `src/utils/attachmentValidation.js`: file signature, text and image-decode checks.
- `test/`: automated regression tests (`npm test`).
- `src/*.css`: shared and page styles.
- `public/logo.png`: SUF logo.
- `docs/`: setup, frontend implementation, verification notes and backend integration guidance.

## Backend handoff

Read the [documentation index](docs/README.md), then use:

- [Setup and build](docs/SETUP.md)
- [Frontend implementation and recent fixes](docs/FRONTEND.md)
- [Backend integration](docs/BACKEND-INTEGRATION.md)

`VITE_42_LOGIN_URL` may point to your backend's 42 sign-in endpoint. No sign-in endpoint is configured by default. Never place private secrets in frontend code or Vite environment variables: values exposed to frontend code are public.

Dependencies, generated build output and local environment files are excluded by `.gitignore`. Commit source, documentation, configuration and the lockfile.
