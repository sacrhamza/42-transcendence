# Backend integration

## Current boundary

Signup and email verification call the authentication backend. Login remains a local prototype. Directly opening `/home` or `/profile` is possible. Backend authentication and authorization must be added before those routes represent protected account data.

## Signup and email verification

Vite proxies `/api` to `http://localhost:3000` by default. Set the `BACKEND_URL` shell environment variable before starting Vite if the backend uses another address.

- Signup sends `POST /api/auth/register` with username, email, and password, then asks the user to check their email.
- The frontend verification page is `/verify-email?token=...`. It sends `GET /api/auth/verify-email?token=...` with `Accept: application/json` once per token during the page session.
- A successful response containing `userId` redirects to `/login` with a registration confirmation. A 400 response redirects to `/signup` with an invalid, expired, or already-used link explanation. Network and server failures show an error on the verification page instead of claiming the token expired.

For local development, set the backend's `NEST_URL` to the frontend origin, for example `http://localhost:5173`. The backend currently creates links at `/api/auth/verify-email`. Vite redirects browser HTML navigation at that path to `/verify-email` before any API request consumes the token. JSON API requests continue through the proxy unchanged.

For deployment, the web server needs the same browser-navigation redirect and `/api` backend proxy, plus the frontend SPA fallback. Vite's development middleware is not included in the static build. Alternatively, the backend team can generate email links directly to the frontend `/verify-email` page. Links to a separate backend origin cannot display the frontend's notifications without a backend or web-server redirect.

## Existing environment settings

Create an untracked `.env.local` in `frontend/` if connecting services:

```dotenv
VITE_42_LOGIN_URL=https://your-backend.example/auth/42
VITE_AUTH_API_URL=https://your-backend.example/auth
```

These URLs are examples, not deployed endpoints. Restart Vite after changing environment settings. Vite environment values are public frontend configuration; keep credentials and private OAuth secrets on the backend.

### 42 sign-in

`LoginPage.jsx` reads `VITE_42_LOGIN_URL`. The button redirects to this URL when configured, or displays an unavailable message otherwise. Only HTTP and HTTPS destinations are accepted.

The backend still needs to implement the OAuth flow, session handling, callback behavior, and server-verified 42 account information. The frontend's verified-only UI is not access control.

### Password recovery

`src/utils/passwordRecovery.js` expects these endpoints relative to `VITE_AUTH_API_URL`:

| Method and path | JSON request |
| --- | --- |
| `POST /password/forgot` | `{ "email": "user@example.com" }` |
| `POST /password/reset` | `{ "token": "backend-issued-token", "password": "new-password" }` |

Requests include JSON headers and credentials. If frontend and backend use different origins, configure backend CORS and cookie behavior accordingly. The frontend checks HTTP success rather than reading a response body.

The UI distinguishes rate limiting (429), invalid/expired reset links (400, 401, or 410 for reset), network errors, and timeout/cancellation. Requests time out after 15 seconds. Without an API URL, recovery explicitly reports that no email was sent and no password was changed.

Reset links use `/reset-password?token=...`. The page reads the token, removes it from the address bar, and retains it in memory for submission. Reloading after the token has been removed requires reopening the original email link.

## Services to connect

- Login, authenticated sessions, and logout.
- Profile persistence and durable photo uploads.
- Shared posts, comments, reactions, saved items, projects, rooms, and attachments.
- Peer requests, public profile lookup, and direct messages backed by accounts.
- Real-time delivery and authorization for chat.
- 42 verification and permissions enforced on the server.
- Code execution infrastructure for the snippet editor if that feature is implemented.

Except for signup, email verification, recovery requests, and the configurable 42 redirect above, these service contracts still need agreement with the backend team. Existing mock data and local state are not an API specification.
