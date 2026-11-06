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
| `/home?post=<id>` | Selected post preview |
| `/projects` | Project directory |
| `/projects?project=<id>` | Selected project |
| `/profile` | Own profile |
| `/profile/<username>` | Public profile from the preview directory |
| `/peers` | Peer directory |
| `/messages` | Message inbox |
| `/messages/<username>` | Selected conversation |

Opening `/` replaces the address with `/login`. Old bookmarks such as `/#/login` are converted to `/login` at startup. Internal navigation uses the History API and supports Back/Forward without clearing all application state. Unknown routes show the login view; they are not server-side 404 pages.

## Login and signup

The same component renders the two forms, with the mode controlled by the route. Switching forms resets their input state.

- Signup username: required, 3–24 letters, numbers, or underscores.
- Email: required and checked using the browser's email validation.
- Signup password: required, minimum 12 characters.
- Confirmation: required and must match the password.
- Mismatches show “Your passwords do not match” next to confirmation, set native custom validity, and block submission. Editing either password updates the warning.
- Password visibility can be toggled.

Successful form submission currently opens `/home` as a preview. It does not create an account, verify credentials, or establish an authenticated session.

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
| `suf-direct-messages` | Local preview conversations |

Storage helpers handle unavailable storage. Some interactions remain in memory only, including newly created posts, projects, rooms, and attachments. Refreshing or leaving a view can reset that state. Clearing browser site data removes locally saved data. Browser storage is not a backend database.

## Recent work

- Replaced hash navigation with clean paths; login and signup now have distinct URLs. Preserved old bookmarks, query parameters, and browser history navigation.
- Updated recovery links and query-token handling for clean URLs.
- Removed Display name from the profile and retained username.
- Added immediate password-confirmation feedback and native validation.

Related commits: `6003b6f` (`fixing # / login&singup problem`) and `a92c829` (`Fix signup password confirmation validation`).

## Verification

The production build passed after the recent code changes. Temporary DOM interaction checks covered login/signup switching, direct route initialization, Back/Forward, legacy bookmarks, recovery navigation, token submission, and profile navigation. Password checks covered the mismatch `1234567890abc` / `1234567890abcd`, correction, editing either field, required confirmation, and successful matching submission.

Those scripts were run outside the repository. There is no committed automated test suite or `npm test` script for this frontend. DOM checks do not establish full browser compatibility or backend correctness.

For manual checks, run the frontend, switch between login and signup, test mismatching and matching passwords, try Back/Forward, refresh `/signup`, edit and save a username, then refresh `/profile` to verify local persistence. Check light/dark themes and narrow screens as part of UI review.
