# Frontend implementation

## Source organization

| Location | Responsibility |
| --- | --- |
| `src/main.jsx` | Mount React, load styles, convert old hash bookmarks to clean URLs |
| `src/App.jsx` | Choose the page, listen to browser history, manage theme |
| `src/utils/navigation.js` | Change the URL without reloading the application |
| `src/pages/` | Authentication, recovery, home, projects, profiles, peers, and messages |
| `src/components/` | Shared UI, post interactions, discussion rooms, and code presentation |
| `src/data/` | Example posts, projects, rooms, peers, and messaging helpers |
| `src/utils/` | Browser storage, profile loading, avatar preparation, recovery requests, and file helpers |
| `src/*.css` | Shared and page styles |
| `public/` | Static assets, including the logo |

## Routes

| URL | View |
| --- | --- |
| `/login` | Login form |
| `/signup` | Signup form |
| `/forgot-password` | Request password recovery |
| `/reset-password?token=…` | Reset password using a backend-issued token |
| `/home` | Feed |
| `/home_post_<id>` | Selected post preview |
| `/projects` | Project directory |
| `/projects?project=<id>` | Selected project |
| `/profile` | Own profile |
| `/profile/<username>` | Public profile from the preview directory |
| `/peers` | Peer directory |
| `/messages` | Message inbox |
| `/messages/<username>` | Selected conversation |

Shared post links use `/home_post_<id>` without a query string. Older `/home?post=<id>` bookmarks still open the selected post.

Opening `/` replaces the address with `/login`. Old bookmarks such as `/#/login` are converted to `/login` at startup. Internal navigation uses the History API and supports Back/Forward without clearing all application state. Unknown routes show the login view; they are not server-side 404 pages.

## Login and signup

The same component renders the two forms, with the mode controlled by the route. Switching forms resets their input state.

- Signup username: required, 2–50 characters without whitespace.
- Email: required and checked using the browser's email validation.
- Signup password: required, 8–50 characters. The backend requires uppercase and lowercase letters, a number, a symbol, no whitespace, and no full username in the password.
- Confirmation: required and must match the password.
- Mismatches show “Your passwords do not match” next to confirmation, set native custom validity, and block submission. Editing either password updates the warning.
- Password visibility can be toggled.

Signup calls `/api/auth/register` and asks the user to verify their email before logging in. Login calls `/api/auth/login`; a `200` response with `{ "message": "Login successful" }` opens `/home`, while the backend stores tokens in HttpOnly cookies. The frontend keeps only an in-memory navigation flag. Session restoration, token refresh, and server-side logout are not implemented; see [Backend integration](BACKEND-INTEGRATION.md).

## Profile

The profile uses username as its identity. The separate Display name field was removed. The heading, photo description, and fallback initials use username.

Users can edit username, bio, skills, GitHub, portfolio, LinkedIn, and profile photo. The editor validates usernames and website links. Profile photos are prepared locally. Save updates browser storage; Cancel discards the draft. This does not update a backend account.

## Community features

The UI includes a feed with search, pagination, posts, comments, likes and saved posts; project discovery and creation; project discussion rooms and attachments; peer requests and public profiles; and direct-message previews. Data comes from examples and local state. These features are not shared between accounts or devices.

The snippet editor presents C, JavaScript, and C++ code with input/output controls. The Run snippet action does not compile or execute code.

## Browser storage

| Key | Content |
| --- | --- |
| `suf-theme` | Selected theme |
| `suf-profile` | Username, bio, skills, links, and photo |
| `suf-saved-posts` | Saved post IDs |
| `suf-peer-relationships` | Local peer relationship states |
| `suf-direct-messages` | Legacy conversations, imported when IndexedDB has no messages record |

Posts, projects, rooms, and direct messages are stored in the `suf-preview` IndexedDB database (`state` object store). File bytes are stored as Blobs and temporary display URLs are rebuilt on load. Updates read and change the latest stored record in a transaction, so two tabs do not replace each other's conversation snapshots. BroadcastChannel notifies other tabs of saves where supported; returning to a tab also reloads saved state.

If storage is unavailable or a write fails, affected state continues in memory with an explicit warning. After a failed write, background reloads do not overwrite those unsaved changes. Copy important content before closing or refreshing. Clearing site data or browser eviction removes local content. Changing origin (for example, localhost to a LAN IP or another port) uses separate storage. This is browser persistence, not a backend database or cross-device synchronization.

## Recent work

- Replaced hash navigation with clean paths; login and signup now have distinct URLs. Preserved old bookmarks, query parameters, and browser history navigation.
- Updated recovery links and query-token handling for clean URLs.
- Removed Display name from the profile and retained username.
- Added immediate password-confirmation feedback and native validation.
- Fixed post sharing to use `/home_post_<id>` and clamped pagination when a shared post reduces the result count.
- Handled malformed 42 sign-in URLs with a visible notice instead of an uncaught error.
- Added extension/signature checks for binary attachments, UTF-8 validation for text/code, and image decoding before accepting images. Validation runs before adding files to posts, project briefs, or room messages; pending checks disable submission. Binary header checks are best-effort format checks, not complete validation of complex document/media formats. Server-side validation is still required.
- Persisted local content and file bytes in IndexedDB and made message updates transactional across tabs.
- Replaced timestamp-only post/project/room IDs with random IDs that also work on HTTP LAN previews.

Related commits: `6003b6f` (`fixing # / login&singup problem`) and `a92c829` (`Fix signup password confirmation validation`).

## Verification

The production build passed after the recent code changes. Temporary DOM interaction checks covered login/signup switching, direct route initialization, Back/Forward, legacy bookmarks, recovery navigation, token submission, and profile navigation. Password checks covered the mismatch `1234567890abc` / `1234567890abcd`, correction, editing either field, required confirmation, and successful matching submission.

Run the committed regression suite from `frontend/` with:

```sh
npm install
npm test
```

The Node test runner and development-only `fake-indexeddb` dependency cover simultaneous message writes, persisted attachments and rebuilt download URLs, failed transaction rollback, invalid and valid file formats, image-decode failure, and ID uniqueness. The dependency lockfile includes the test dependency.

Additional temporary DOM checks cover malformed OAuth configuration, clean share URLs, shared-post pagination, post/project/room/message/file reloads, and storage-denial feedback. These interaction scripts run outside the repository. DOM tests and simulated IndexedDB do not establish full browser compatibility, real disk quota behavior, or backend correctness.

For manual checks, run the frontend, switch between login and signup, test mismatching and matching passwords, try Back/Forward, refresh `/signup`, edit and save a username, then refresh `/profile` to verify local persistence. Check light/dark themes and narrow screens as part of UI review.
