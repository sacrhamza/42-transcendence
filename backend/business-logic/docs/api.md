# Business Logic API Reference

This document covers all seven HTTP endpoints currently implemented in `src/auth/auth.controller.ts`, including login, refresh, logout, and the two protected test routes. It describes the checked-in code; the examples and verification checklist are not results of live integration tests.

## Connection and common rules

- All routes start with `/api/auth`. Nest uses the global `/api` prefix.
- Nest listens on `NESTJS_PORT`, default `3000`. Direct local backend origin: `http://localhost:3000`.
- Send JSON bodies with `Content-Type: application/json`.
- Registration and login use DTO validation. Unknown body properties return `400` because `whitelist` and `forbidNonWhitelisted` are enabled.
- Database user IDs are returned as **strings**. Do not convert them to JavaScript numbers.
- Success bodies use either `msg` or `message`, depending on the endpoint. Preserve the exact contracts below.
- Authentication uses **HttpOnly cookies**. The HTTP API does not return tokens in JSON or read an `Authorization: Bearer` header.

| Method | Path | Required credential | Success | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | None | `202` | Store pending registration and send a verification email |
| `GET` | `/api/auth/verify-email?token=...` | Email verification token | `201` | Consume the token and create the account |
| `POST` | `/api/auth/login` | Email and password | `200` | Create a refresh session and set authentication cookies |
| `POST` | `/api/auth/refresh` | `refresh_token` cookie | `200` | Rotate the refresh token and issue a new access token |
| `POST` | `/api/auth/logout` | Optional `refresh_token` cookie | `200` | Delete the matching refresh session and clear cookies |
| `GET` | `/api/auth/user` | `access_token` cookie | `200` | Test access-token authentication |
| `GET` | `/api/auth/users` | `access_token` cookie | `200` | Test authentication and return the authenticated user ID |

The last two endpoints are test routes. They do not return profiles or a users list. Password recovery, 42 OAuth, profile editing, session listing, and logout from all devices have no HTTP endpoints in this service yet.

## Cookies and session lifetime

| Cookie | Lifetime on login | Path | Attributes |
| --- | --- | --- | --- |
| `access_token` | 5 minutes | `/` | `HttpOnly; Secure; SameSite=Lax` |
| `refresh_token` | 7 days | `/api/auth` | `HttpOnly; Secure; SameSite=Lax` |

`Secure` is always enabled in the controller, including development. Use HTTPS for reliable browser integration; do not assume an arbitrary HTTP development host will retain and send these cookies. Check cookie storage and blocked-cookie reasons in browser developer tools if login returns `200` but protected requests return `401`.

JavaScript cannot read these cookies. Let the browser store them; use `credentials: 'include'` on authentication and protected requests. The refresh-cookie path covers both refresh and logout.

The access JWT contains the user ID in `sub`. The refresh JWT contains `sub` and a unique `jti`. Login stores a bcrypt hash of the refresh token, its `jti`, user ID, and expiry in PostgreSQL. Each successful login creates a separate refresh-session record.

Refresh keeps the original refresh-token expiry: it does **not** start another seven-day period. It replaces the current session's `jti` and token hash and sets the refresh cookie's remaining lifetime. The access cookie receives another five minutes. The access guard does not check the refresh session, so an access token can remain usable until its own expiry even after the refresh session expires or is deleted.

### Browser origin and proxy setup

`src/main.ts` does not enable CORS. The frontend's Vite development server proxies `/api` to `BACKEND_URL`, default `http://localhost:3000`. Relative `/api/...` requests can therefore use the frontend origin in development.

The checked-in Nginx main template does not proxy `/api`. Production needs a working API proxy or explicitly configured CORS. Cross-origin credentialed requests require an allowed frontend origin and credential support on the backend; `credentials: 'include'` alone cannot solve CORS or cross-site restrictions from `SameSite=Lax`.

## POST `/api/auth/register`

Request:

```json
{
  "username": "syna_test_001",
  "email": "syna_test_001@example.com",
  "password": "SecurePass123!"
}
```

| Field | Current validation |
| --- | --- |
| `username` | Required string, lowercased, 2–50 characters, no whitespace |
| `email` | Required string, lowercased, valid email, maximum 50 characters |
| `password` | Required string, 8–50 characters, lowercase + uppercase + number + symbol, no whitespace; cannot contain the full username ignoring case |

Username and email are not trimmed. Password casing is preserved. Send only these three fields; `confirmPassword` is frontend-only.

Success: **`202 Accepted`**.

```json
{ "msg": "check your email" }
```

The account does not exist yet. Pending data is stored in Redis for **15 minutes**, and a verification link is emailed. This response neither logs the user in nor sets authentication cookies. The token and link are not returned in JSON.

| Status | Message / condition |
| --- | --- |
| `400` | DTO validation errors or `Password must not contain username` |
| `409` | `User already registered`, `Username already taken`, or `Email already registered` |
| `503` | `Registration service temporarily unavailable` when Redis storage fails; `Database temporarily unavailable` for an explicitly handled email-lookup database error |
| `500` | Other unhandled failures, including username-lookup database errors or verification-email failure |

See the [registration integration guide](api-auth-register.md) for validation details, duplicate checks, pending registrations, and recovery cases.

## GET `/api/auth/verify-email?token=...`

Send the single token received by email as a URL-encoded query parameter. No body or authentication cookie is required.

```http
GET /api/auth/verify-email?token=<token-from-email>
Accept: application/json
```

Success: **`201 Created`**.

```json
{
  "msg": "User registered successfully",
  "userId": "1"
}
```

The backend atomically reads and deletes the pending Redis record, creates the account, then sends a welcome email. It returns JSON and does not log the user in. The token is single-use and consumed **before** database creation and welcome-email delivery. A later failure or lost response can leave an account created with no reusable verification link; offer login as a recovery option and avoid automatic verification retries.

The emailed link points to `/api/auth/verify-email` on `NEST_URL`. Direct navigation to Nest shows JSON. When `NEST_URL` points to the Vite frontend, Vite redirects browser HTML navigation to `/verify-email`; that page sends the JSON verification request through the proxy. This redirect is development middleware and must be configured separately for deployment.

| Status | Message / condition |
| --- | --- |
| `400` | `Verification token is required` |
| `400` | `Verification token is invalid or expired` — also covers consumed tokens |
| `409` | `Username or email already registered` |
| `503` | `Database temporarily unavailable` for recognized creation failures, provided the follow-up failure email succeeds |
| `500` | Unhandled Redis, token-input, database, or mail errors; account creation may already have succeeded |

## POST `/api/auth/login`

Request:

```json
{
  "email": "syna_test_001@example.com",
  "password": "SecurePass123!"
}
```

`email` must be a nonempty valid email; `password` must be a nonempty string. The login DTO does **not** lowercase or trim either field and does not apply registration's password-strength or length rules. Submit the lowercase email stored during registration and preserve the password exactly. Username login and extra fields such as `rememberMe` are unsupported.

The backend looks up the registered email, checks the bcrypt password hash, signs the tokens, and persists a refresh session before setting cookies. A pending, unverified registration has no account to log in to.

Success: **`200 OK`**, with both cookies from the cookie table.

```json
{ "message": "Login successful" }
```

There is no user profile, user ID, token, or `tokenType` in the HTTP response body. A `200` does not prove that the browser accepted the cookies; a protected request checks that next.

| Status | Message / condition |
| --- | --- |
| `400` | Invalid/missing email or password, or unsupported JSON properties |
| `401` | `Invalid credentials` for an unknown email or incorrect password |
| `503` | `Database temporarily unavailable` for handled email-lookup errors or any session-creation database failure |
| `500` | Other unhandled failures, including signing/configuration errors |

## POST `/api/auth/refresh`

Send the `refresh_token` cookie. No body or valid access token is required. A token in JSON or an authorization header is not used.

```http
POST /api/auth/refresh
Cookie: refresh_token=<browser-managed-refresh-token>
```

The backend verifies the refresh JWT, finds its session by `jti`, checks ownership and expiry, compares the token with the stored bcrypt hash, and rotates the session. Success: **`200 OK`**, with replacement access and refresh cookies.

```json
{ "message": "Tokens is refreshed successful" }
```

The message above is the exact current response string. The refresh expiry remains the original login expiry.

| Status | Message / condition |
| --- | --- |
| `401` | `Missing refresh token` — cookie missing or not a string |
| `401` | `Invalid refresh token` — JWT invalid/expired, session missing, wrong owner, expired session, or hash mismatch |
| `401` | `Session expired or already rotated` — the conditional rotation no longer matches the old session `jti` |
| `401` | `Session expired` — expiry reached before the controller sets replacement cookies |
| `503` | `Database temporarily unavailable` — session lookup or rotation failed |
| `500` | Other unhandled failures |

An empty cookie string reaches verification and produces `Invalid refresh token`. A successful rotation invalidates the previous `jti`; concurrent refreshes using the same token can have only one successful database rotation. The losing request returns `401`, either during lookup or rotation depending on timing. Share one in-flight refresh request across frontend callers/tabs where possible. Do not run refresh recursively or blindly retry it after an uncertain network result: the session may have rotated without the browser receiving the new cookie. Refresh errors do not explicitly clear cookies.

## POST `/api/auth/logout`

Send cookies with no body. The route has no access-token guard, so it can be called after the access token expires.

```http
POST /api/auth/logout
Cookie: refresh_token=<browser-managed-refresh-token>
```

For a valid refresh JWT, the backend deletes the session matching its `jti` and user ID. It then clears `access_token` at `/` and `refresh_token` at `/api/auth`.

Success: **`200 OK`**.

```json
{ "message": "Logout successful" }
```

- Missing, empty, invalid, or expired refresh tokens still allow `200` and cookie clearing. Invalid or expired JWTs do not trigger database session deletion.
- A valid JWT whose matching session is already absent also allows `200`.
- A database deletion failure returns `503` with `Database temporarily unavailable`; execution stops before cookies are cleared. Other unhandled failures return `500`.
- Logout affects the matching refresh session. It does not delete other login sessions or revoke an already issued access JWT. A copied access token can remain valid for the rest of its five-minute lifetime.

## GET `/api/auth/user`

Requires the `access_token` cookie. Success: **`200 OK`**.

```json
{ "msg": "hello from protected route guards it work perfectly" }
```

This only confirms that the access JWT passes `AuthGuard`; it does not query the database or return account data.

## GET `/api/auth/users`

Requires the `access_token` cookie. Success: **`200 OK`**.

```json
{
  "userId": "1",
  "msg": "Protected route works"
}
```

`AuthGuard` verifies the access JWT and assigns its `sub` to `req.user`; the controller returns that string as `userId`. Despite the plural route name, this endpoint does not list users.

Both protected routes return:

| Status | Message |
| --- | --- |
| `401` | `Missing access token` |
| `401` | `Invalid or expired access token` |

A refresh cookie alone cannot authenticate these routes. The guard does not refresh tokens automatically or check the database user/session state.

## Error response format

Business exceptions normally return:

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

DTO errors use a `message` array, for example:

```json
{
  "message": ["property rememberMe should not exist"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Unhandled failures normally return `{ "statusCode": 500, "message": "Internal server error" }`. Support both strings and arrays for `message`, and do not require `error`. There are no stable business-error codes or configured rate limits in these routes.

## Frontend request examples

These requests assume `/api` reaches Nest through the frontend origin. Handle non-success responses using the error format above.

```js
// Login: tokens are stored by the browser, not in localStorage.
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'syna_test_001@example.com', password }),
});
if (!loginResponse.ok) throw new Error('Login failed');

// Restore/check authentication after a reload.
let userResponse = await fetch('/api/auth/users', {
  credentials: 'include',
});

// On an access-token 401, refresh once, then retry this GET once.
if (userResponse.status === 401) {
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!refreshResponse.ok) throw new Error('Session could not be refreshed');
  userResponse = await fetch('/api/auth/users', { credentials: 'include' });
}
if (!userResponse.ok) throw new Error('Authentication check failed');
const { userId } = await userResponse.json();

// Call the backend before clearing the frontend authentication state.
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
if (!logoutResponse.ok) throw new Error('Server logout could not be confirmed');
```

In a full frontend client, coordinate refresh across simultaneous requests. A refresh `401` requires login; a `503` or transport error needs temporary-failure handling and does not prove credentials are invalid. Retry other requests only when their semantics permit it.

## Manual verification checklist

For the full DevOps test plan with 10 cases per endpoint, see [manual API tests](../tests/README.md).

Use a test account, controlled mailbox, database, Redis, SMTP configuration, `NEST_URL`, and both JWT secrets. Cookie checks require a suitable browser/HTTPS or local development setup. These are suggested checks, not executed tests.

1. Register → `202`; verify once → `201` with a string ID; verify again → `400`.
2. Login with an unknown email/wrong password → `401`; valid credentials → `200` and both cookies with the documented paths and attributes.
3. Submit extra login fields or malformed email → `400`. Check that mixed-case login email is not normalized by this DTO.
4. Call both protected routes without an access cookie → `401`; with a valid cookie → the exact documented `200` bodies.
5. Let access expire; protected route → `401`; refresh → `200`; protected route → `200`.
6. Confirm refresh replaces the token/session `jti`, preserves the original expiry, and the previous refresh token fails afterward.
7. Send concurrent refresh requests with the same token → at most one successful rotation.
8. Logout → `200`, cookies cleared, matching session deleted; the old refresh token fails. Other login sessions remain independent.
9. Logout without cookies or with an invalid refresh token → `200`. Simulate a database deletion failure with a valid token → `503`, without successful cookie clearing.
10. Check session creation/lookup/rotation outages → `503`, and browser behavior through the actual frontend proxy and deployed HTTPS origin.

## Implementation references

- [Controller, routes, responses, and cookies](../src/auth/auth.controller.ts)
- [Authentication, token issuance, refresh, and logout](../src/auth/auth.service.ts)
- [Session persistence and conditional rotation](../src/auth/SessionService/session.service.ts)
- [Access-token guard](../src/guards/auth.guard.ts) and [request user type](../src/common/types/auth-request.type.ts)
- [Registration DTO](../src/dto/RegisterDto.ts) and [login DTO](../src/dto/LogingDto.ts)
- [User lookups and creation](../src/users/user.service.ts)
- [Email verification](../src/email-verification/email-verification.service.ts)
- [Global prefix, validation, and cookie parser](../src/main.ts)
- [Database schema](../prisma/schema.prisma)
- [Frontend Vite proxy and verification redirect](../../../frontend/vite.config.js)
- [Deployment Nginx template](../../../devops/nginx/templates/main.conf.template)
