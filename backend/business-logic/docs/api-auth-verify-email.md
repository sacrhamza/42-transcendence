# Email Verification API — Frontend Integration Guide

This document describes the current email-verification implementation in this working tree. Verification consumes pending registration data from Redis and creates the account in PostgreSQL. **A successful registration request alone does not create an account.** The behavior below is based on code inspection, not executed integration tests.

See [registration](api-auth-register.md) to request a verification email, [login](api-auth-login.md) for the next step, and the [API index](README.md) for all routes.

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Success status | Success body |
| --- | --- | --- | --- | --- |
| Consume the verification token and create a normal account | `GET` | `/api/auth/verify-email?token=<token>` | `201 Created` | `{ "msg": "User registered successfully", "userId": "1" }` |

- Public endpoint; no access or refresh cookie is required.
- Expects a query parameter, not JSON or a bearer header.
- Success uses `msg`, while errors use `message`.
- `userId` is a string converted from a database `BigInt`; keep it as a string.
- The endpoint returns JSON directly. It does not redirect, set authentication cookies, or log the user in.

## 2. Token origin, lifetime, and request

The preceding `POST /api/auth/register` generates 32 random bytes encoded as a 64-character hexadecimal token. It hashes the token with SHA-256 and stores this JSON under `registration:<tokenHash>` in Redis:

```json
{
  "username": "syna_test_001",
  "email": "syna_test_001@example.com",
  "passwordHash": "<bcrypt-hash>"
}
```

The Redis record expires after **900 seconds / 15 minutes**. That countdown starts when the pending record is stored, before verification-mail delivery finishes. The raw password is not stored in this record.

The raw token is delivered only in the emailed link:

```text
<origin from NEST_URL>/api/auth/verify-email?token=<64-character-hex-token>
```

`NEST_URL` must be reachable by the recipient's browser. `new URL('/api/auth/verify-email', NEST_URL)` replaces any path component of the configured base URL.

```http
GET /api/auth/verify-email?token=<token-from-email>
```

Send the single original token value, URL-encoded. The controller uses `@Query('token') token: string` without a token DTO or explicit length/hex validation. TypeScript's `string` annotation does not itself validate query input at runtime. Missing/empty input is checked; repeated/nested parameters can produce unsupported types and an unhandled error.

## 3. Backend processing and account creation

1. Reject a missing or empty token with `400 Verification token is required`.
2. Hash the supplied token using SHA-256.
3. Atomically read **and delete** `registration:<tokenHash>` using Redis `GETDEL`.
4. If no pending record is returned, respond with `400 Verification token is invalid or expired`.
5. Parse the pending JSON containing username, email, and bcrypt password hash. This record was created by the registration flow, rather than supplied as a request body.
6. Call `UsersService.createUser()`, which creates `users` and its related `normal_users` row in one Prisma nested write:

   | Model | Values |
   | --- | --- |
   | `users` | Empty `bio`; generated ID; schema defaults for profile image, dates, and `deleted: false` |
   | `normal_users` | Username in `name`, email in `mail`, existing bcrypt hash in `password`, relationship to the new user |

7. If Redis is ready, try adding username to `names` and email to `mails`. Cache-update failures are caught/logged and do not roll back account creation.
8. Await `sendWelcomeEmail(email, username)`. That mail method catches/logs its own failures, so a welcome-mail delivery failure does not change an otherwise successful verification into an error.
9. Return:

   ```json
   {
     "msg": "User registered successfully",
     "userId": "1"
   }
   ```

The username belongs to `normal_users.name`, not `users.name`. Username uniqueness is enforced inside `normal_users`; email is its primary key. This verification path does not create an `ft_users` row or link an existing 42 account.

**The pending token is consumed before database creation.** Database failure, corrupt pending JSON, or a lost response does not restore that token. The nested database write is atomic, but Redis consumption, cache updates, and email are not part of that database operation.

## 4. Browser navigation and frontend verification page

Opening the backend URL directly displays the endpoint's JSON. The controller has no success or failure redirect.

The current frontend has a `/verify-email` page. During Vite development, HTML browser navigation to `/api/auth/verify-email?token=...` is redirected to `/verify-email?token=...`. That page sends its JSON API request through the Vite proxy. This applies when emailed links target the frontend origin through `NEST_URL`; a direct backend link does not run Vite middleware.

Vite's redirect plugin runs only in the development server. Static deployment needs equivalent server routing or an agreed change to the email-link format. Nest does not enable CORS, and the checked-in main Nginx template does not proxy `/api`.

Since this is a state-changing `GET`, email scanners, link previews, prefetchers, and duplicate browser requests can consume the token. Do not request the endpoint merely to check whether the link is valid. Avoid automatically retrying verification on mount, page reload, or transport failure.

## 5. Error responses

```json
{
  "message": "Verification token is invalid or expired",
  "error": "Bad Request",
  "statusCode": 400
}
```

| Status | Message / source | Frontend interpretation |
| --- | --- | --- |
| `400` | `Verification token is required` | Token query parameter is missing or empty |
| `400` | `Verification token is invalid or expired` | Unknown, modified, expired, or already consumed token; these cases are not distinguished |
| `409` | `Username or email already registered` | Prisma `P2002` recognized by the creation handler; another registration may have won |
| `503` | `Database temporarily unavailable` | Creation handler recognized Prisma `P1001` or `P1002` |
| `500` | `An unexpected error occurred` | Unrecognized database-creation error mapped by `UsersService` |
| `500` | Normally `Internal server error` | Unhandled Redis `GETDEL`, unsupported token type, pending JSON parsing, or another runtime failure |

On the recognized creation-outage path, the backend attempts a failure email explaining that the old link is no longer valid and registration should be repeated. `send_try_registreation()` catches/logs its own mail errors, so failure of that notification does not replace the intended `503`.

Business exceptions normally contain `{ message, error, statusCode }`. Unhandled `500` responses normally contain only `statusCode` and `message`. There are no custom business error codes; support unknown messages and network failures.

A verification-mail send failure belongs to the preceding registration call. Welcome-mail failures are handled inside the mail service and do not undo the new account.

## 6. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| Same token requested twice | Atomic `GETDEL` gives data to at most one request; the other sees invalid/expired | Send verification once per token |
| First request consumed the token but creation failed | Pending data is gone; retrying the same link cannot recreate it | Start registration again if no account exists |
| Response was lost after successful creation | Account may exist although the browser did not receive `201` | Offer login and deliberate recovery |
| Several registration requests used the same details | Each pending token has its own TTL; later requests do not invalidate earlier ones | Do not promise that only the newest link works |
| Different pending tokens compete for one username/email | First successful database creation wins; later unique conflicts map to `409` | Offer login if registration already completed |
| Token expires or is changed | No matching record; same `400` as an already-used token | Offer a fresh registration attempt |
| Redis read/delete fails | Unhandled error, normally `500`; do not assume token state is known | Show a general failure without automatic verification retry |
| Cache update fails after creation | Error is caught; welcome email and success flow continue | Handle the final `201` normally |
| Welcome email fails | Error is caught/logged; verification still returns `201` if other steps succeeded | User can proceed to login |
| Database-outage notification fails | Error is caught/logged; intended creation `503` remains | Follow the fresh-registration recovery path |
| Email scanner follows the real API link | The `GET` can consume the token and create the account | Do not prefetch verification URLs |
| User expects immediate authenticated state | Verification creates no session/cookies | Navigate to login after `201` |

No separate resend or token-status endpoint is implemented. While username/email remain available, repeating registration can request another email; it creates another pending token rather than resetting the previous one.

## 7. Suggested frontend flow

1. Read the token from the verification-page URL and show a clear error if absent.
2. Make one deliberate API request for that token. Guard duplicate effects and repeated submissions.
3. On `201`, show account-created success and a login action; preserve the string `userId` if needed.
4. On invalid/expired `400`, offer login if already verified and registration if a fresh link is needed.
5. On `409`, offer login or registration with unused details. On `503`, explain that a new registration is needed once service is available because the token has been consumed.
6. On network failure or general `500`, acknowledge the uncertain outcome and offer recovery without automatically calling the old link again.

```js
// Invoke once from the verification-page flow; this helper does not deduplicate calls.
async function verifyEmail(token) {
  if (!token) return { kind: 'missing-token' };

  const query = new URLSearchParams({ token });
  const response = await fetch(`/api/auth/verify-email?${query}`, {
    headers: { Accept: 'application/json' },
  });
  const body = await response.json().catch(() => null);

  if (response.status === 201) {
    return { kind: 'created', userId: body?.userId, message: body?.msg };
  }
  return {
    kind: 'api-error',
    status: response.status,
    message: body?.message ?? 'Verification could not be completed',
  };
}
// Handle network errors in the caller; do not automatically retry this GET.
```

## 8. Integration scenarios to verify

These are proposed checks, **not executed tests**. Use controlled mailboxes and a test database; success creates real account records.

- Valid pending token → `201`, string user ID, linked `users`/`normal_users`, no authentication cookies.
- Missing/empty token → required-token `400`; modified, expired, or reused token → invalid/expired `400`.
- Two simultaneous requests using one token → at most one receives pending data.
- Different tokens competing for username/email → one creation, then recognized uniqueness conflicts.
- Database failure after `GETDEL` → consumed link; recognized connection errors → `503`; other creation errors → explicit `500`.
- Failure-notification email outage → original handled `503` preserved.
- Redis outage or corrupt pending JSON → general server-error handling.
- Cache-update and welcome-mail failures → account remains created; handled mail failure does not prevent `201`.
- Direct backend link versus Vite frontend link, browser HTML redirect, JSON proxy request, and static production routing.

## 9. Implementation references

- [Route and success status](../src/auth/auth.controller.ts)
- [Auth-service delegation](../src/auth/auth.service.ts)
- [Pending data, SHA-256, GETDEL, and verification flow](../src/email-verification/email-verification.service.ts)
- [Nested creation, cache update, and error mapping](../src/users/user.service.ts)
- [Verification URL, welcome email, and caught notification failures](../src/mail/mail.service.ts)
- [Redis wrappers](../src/redis/redis.service.ts)
- [Schema and unique constraints](../prisma/schema.prisma)
- [Frontend development routing](../../../frontend/vite.config.js)
- [Frontend verification page](../../../frontend/src/pages/EmailVerificationPage.jsx)
