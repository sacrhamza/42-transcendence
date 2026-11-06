# Backend integration

## Current boundary

The frontend is a local prototype. Login and signup do not call authentication endpoints. Directly opening `/home` or `/profile` is possible. Backend authentication and authorization must be added before those routes represent protected account data.

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

- Login, signup, authenticated sessions, logout, and server validation of email/username uniqueness.
- Profile persistence and durable photo uploads.
- Shared posts, comments, reactions, saved items, projects, rooms, and attachments.
- Peer requests, public profile lookup, and direct messages backed by accounts.
- Real-time delivery and authorization for chat.
- 42 verification and permissions enforced on the server.
- Code execution infrastructure for the snippet editor if that feature is implemented.

Except for the recovery requests and configurable 42 redirect above, these service contracts still need agreement with the backend team. Existing mock data and local state are not an API specification.
