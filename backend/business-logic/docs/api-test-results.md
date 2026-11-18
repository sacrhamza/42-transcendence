# Live API Check — 2026-11-18

The checks below were executed against the running backend at `http://localhost:3001`. They used real HTTP requests and the running database/Redis/mail services. Mailpit was available at `http://localhost:8025`. No application implementation was changed during this check.

## Current result after login correction

The user corrected the login query and updated the running backend. A live recheck using the user-supplied existing account passed the full login/refresh/logout sequence:

| Recheck | Actual status | Verified behavior |
| --- | --- | --- |
| Login with correct supplied credentials | `200` | `Login successful`; access and refresh cookies issued |
| Refresh using that session's cookie jar | `200` | Refresh token and `jti` changed; original refresh `exp`, user, and role preserved |
| Refresh using the token saved before rotation | `401` | `Invalid refresh token` |
| Logout using the current rotated session | `200` | `Logout successful`; both authentication cookies cleared |
| Refresh using the last valid token saved before logout | `401` | `Invalid refresh token`; the logged-out session can no longer refresh |
| Login with an unknown email | `401` | `Invalid credentials` |
| Login with an incorrect password | `401` | `Invalid credentials` |

The access cookie had `Max-Age=300; Path=/; HttpOnly; Secure; SameSite=Lax`; the refresh cookie had `Max-Age=604800; Path=/api/auth; HttpOnly; Secure; SameSite=Lax`. The cookie jar was empty of both authentication cookies after logout. Only the session created for this recheck was logged out.

These seven follow-up requests all returned the expected result. The account password and token values are not recorded here. The failures below describe the earlier backend version, before the correction took effect.

## Initial result before login correction

Registration and email verification succeeded end to end. **Email/password login failed with `500`**, both for an unknown email and for a newly verified account with its correct password. Backend container logs confirmed a Prisma validation error caused by selecting a nonexistent field:

```text
Unknown field `name` for select statement on model `users`.
```

The query is in [findByEmailForAuth](../src/users/user.service.ts). The earlier implementation included `users: { select: { id: true, name: true, deleted: true } }`, but the username is stored in `normal_users.name`. The corrected implementation selects `name` from `normal_users` and only `id`/`deleted` from its related `users`. The login service does not currently use the selected username.

A successful local TypeScript check did not detect this runtime query error. Confirmation came from the live `500` responses and matching `PrismaClientValidationError` entries in `nestjs_backend` logs.

## Initial executed requests

There were 18 backend requests: 16 returned the expected result, and two exposed the login failure.

| Request / scenario | Actual status | Result |
| --- | --- | --- |
| `POST /api/auth/register` with missing fields | `400` | Expected DTO errors |
| Registration with a strong password containing the username | `400` | `Password must not contain username` |
| Registration with fresh valid test details | `202` | `check your email`; verification email received in Mailpit |
| Registration repeated after verification | `409` | `User already registered` |
| `GET /api/auth/verify-email` without token | `400` | `Verification token is required` |
| Verification with an invalid token | `400` | `Verification token is invalid or expired` |
| Verification using the test email's real token | `201` | Account created; string `userId: "2"` |
| Verification using that same token again | `400` | Already consumed token rejected |
| `POST /api/auth/login` with missing fields | `400` | Expected DTO errors |
| Login with a valid-format unknown email | `500` | **Failure:** expected credentials rejection, but Prisma query validation failed |
| Login with the verified test account and correct password | `500` | **Failure:** expected login success, but the same query validation failed |
| `POST /api/auth/refresh` without cookie | `401` | `Missing refresh token` |
| Refresh with a deliberately invalid refresh cookie | `401` | `Invalid refresh token`; confirms the cookie was read |
| `POST /api/auth/logout` without cookie | `200` | `Logout successful`; both clear-cookie headers present |
| Logout with a deliberately invalid refresh cookie | `200` | Same success and cookie-clearing behavior |
| `GET /api/auth/42` | `302` | Redirect to 42 authorization |
| `GET /api/auth/42/callback` without code | `302` | Redirect back to provider authorization |
| Callback with `error=access_denied` | `401` | `Unauthorized` |

## Scope and remaining verification

- Cookie parsing works in the running backend. Sending an invalid refresh cookie reaches JWT validation rather than returning the missing-cookie error.
- Authenticated refresh rotation and logout were initially blocked by login failure; the subsequent live recheck above passed both, including token replay checks.
- Successful 42 authentication/account creation was **not tested** because it requires interactive provider authorization. Only its entry redirect, missing-code behavior, and denial response were checked.
- These HTTP checks do not establish browser cookie acceptance, CORS behavior, access-token expiry recovery, concurrency guarantees, or infrastructure-outage behavior.
- The login → refresh → replay old refresh token → logout → attempt refresh with the logged-out token sequence was completed successfully after the correction.

## Test data

One verified test account remains in the local database:

| Field | Value |
| --- | --- |
| Username | `codex_api_mwlvlbp5` |
| Email | `codex-api-mwlvlbp5@example.com` |
| User ID | `2` |

The verification email was read only from that recipient's Mailpit search results. No existing accounts were modified or removed. Test credentials, verification tokens, OAuth parameters, and JWT secrets are not included in this report.
