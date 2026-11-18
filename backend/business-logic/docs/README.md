# Business Logic API — Frontend Integration Guides

These guides describe the current controller, DTOs, services, and database schema in this working tree. They follow the registration guide's format: request contract, validation, backend steps, responses, errors, edge cases, frontend examples, and integration scenarios. The scenarios are proposed checks, **not executed integration tests**.

Executed checks are recorded separately in the [live API check from 2026-11-18](api-test-results.md). Registration/verification passed. After the login query was corrected, login, authenticated refresh, token-replay rejection, and authenticated logout also passed. Successful provider authorization remains untested.

## Implemented endpoints

| Method | Endpoint | Success | Detailed guide |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `202` — pending registration; verification email requested | [Registration](api-auth-register.md) |
| `GET` | `/api/auth/verify-email?token=<token>` | `201` — account created | [Email verification](api-auth-verify-email.md) |
| `POST` | `/api/auth/login` | `200` — authentication cookies set | [Email/password login](api-auth-login.md) |
| `POST` | `/api/auth/refresh` | `200` — authentication cookies replaced | [Token refresh](api-auth-refresh.md) |
| `POST` | `/api/auth/logout` | `200` — cookies cleared; matching session deleted when available | [Logout](api-auth-logout.md) |
| `GET` | `/api/auth/42` | `302` — redirect to 42 authorization | [Start 42 authentication](api-auth-42.md) |
| `GET` | `/api/auth/42/callback?code=<code>` | `303` — cookies set; redirect to frontend | [42 callback](api-auth-42-callback.md) |

All seven active routes are in [AuthController](../src/auth/auth.controller.ts). The commented `GET /api/auth/user` and `GET /api/auth/users` examples are not registered routes. The FastAPI client and proxy files contain commented code and do not expose additional controller endpoints here.

## Shared request and response rules

- The route prefix is declared as `@Controller('api/auth')`. `app.setGlobalPrefix('api')` is commented out in [main.ts](../src/main.ts); do not add another `/api` segment.
- Nest listens on `NESTJS_PORT`, default `3000`. Use the backend origin configured for your environment.
- JSON requests use `Content-Type: application/json`.
- The global `ValidationPipe` enables `transform`, `whitelist`, and `forbidNonWhitelisted`. DTO-backed registration and login reject unknown fields. Routes without a body DTO do not gain a defined body schema from these options.
- Registration/verification success uses `msg`; login/refresh/logout success uses `message`. OAuth success is a redirect. Tokens are not returned in success JSON.
- Business errors normally contain `{ message, error, statusCode }`. Validation `message` is an array; business `message` is usually a string. Unhandled errors normally return `{ statusCode: 500, message: 'Internal server error' }`. Explicit user-service `500` exceptions use `An unexpected error occurred` instead. There are no custom stable business error codes.
- Account IDs use database `BigInt`. Exposed `userId` and JWT `sub` values are strings.

## Authentication cookies and session lifetime

| Cookie | Flags | Path | Lifetime on login / 42 callback |
| --- | --- | --- | --- |
| `access_token` | `HttpOnly; Secure; SameSite=Lax` | `/` | 5 minutes |
| `refresh_token` | `HttpOnly; Secure; SameSite=Lax` | `/api/auth` | 7 days |

No `Domain` is specified, so these are host-only cookies. Browser JavaScript cannot read them. Send cookie-based API requests with `credentials: 'include'` when needed. Cookie acceptance and transmission still depend on the host, path, HTTPS/trust rules, and `SameSite`; `credentials` does not override those restrictions.

Login creates a PostgreSQL `refresh_sessions` row containing the user ID, a UUID `jti`, a bcrypt token hash, and expiration. Refresh rotates that row and keeps the original JWT expiry. **Refreshing does not start another seven days.** Multiple logins can create separate sessions. Logout targets the session identified by the supplied refresh token; it does not revoke every device or already issued access JWTs.

The roles issued by the current code are `normal_user` and `fortytow_user` (preserve that exact spelling). [AuthenticationGuard](../src/guards/authentication.guard.ts) reads only the access cookie, verifies its JWT, and attaches `{ id, role }` to `req.user`. It does not query the account or session. None of the seven active routes uses this guard; the two demonstration routes using it are commented out.

## Current integration constraints

**Cookie parsing is registered.** `main.ts` calls `app.use(cookieParser())` before handling controller requests. Incoming authentication cookies are available through `req.cookies` for refresh, logout, and the access guard. Restart/rebuild a running instance as appropriate so it uses the updated bootstrap. Successful session rotation/deletion still depends on token validity and the database.

`main.ts` has no `enableCors()`. Vite provides a development `/api` proxy using `BACKEND_URL` or `http://localhost:3000`. The checked-in main Nginx template only returns `ok` and does not proxy `/api`. Deployment needs working API routing and, for a separate frontend origin, suitable CORS configuration. Cookie policies must also match the deployment.

**Normal-login query corrected and rechecked:** `findByEmailForAuth()` selects `normal_users.name` alongside the password hash and related `users.id`/`users.deleted`. The earlier invalid `users.name` selection has been removed. Live login with a user-supplied existing account now returns `200`; authenticated refresh/logout and rejection of rotated or logged-out refresh tokens were also verified. See the [live test results](api-test-results.md).

Verification emails use `NEST_URL`. Vite's development middleware redirects HTML navigation from `/api/auth/verify-email` to `/verify-email`; JSON requests still use the API proxy. Static deployment needs equivalent routing if emailed links target the frontend. The 42 callback instead redirects to the hard-coded `http://localhost:3001/feed`, regardless of `NEST_URL`.

## Implementation references

- [Controller and cookie options](../src/auth/auth.controller.ts)
- [Bootstrap and validation](../src/main.ts)
- [Authentication service](../src/auth/auth.service.ts)
- [Session persistence and rotation](../src/auth/SessionService/session.service.ts)
- [User persistence and error mapping](../src/users/user.service.ts)
- [42 strategy](../src/auth/strategy/fortytow.strategy.ts)
- [Database schema](../prisma/schema.prisma)
- [Frontend development proxy](../../../frontend/vite.config.js)
- [Main Nginx template](../../../devops/nginx/templates/main.conf.template)
