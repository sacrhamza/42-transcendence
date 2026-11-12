# Registration API — Frontend Integration Guide

This document describes the current implementation in this working tree. Registration has two steps: submit account details, then verify the email address. **The account is created only during email verification.**

For login, refresh, logout, cookies, and protected endpoints, see the [complete API reference](api.md).

This replaces the previous description of immediate account creation with a `201` response from `/register`. The behavior below is based on code inspection; it is not a report of executed integration tests.

## 1. Endpoints and response contract

| Purpose | Method | Endpoint | Success status | Success body |
| --- | --- | --- | --- | --- |
| Request registration and a verification email | `POST` | `/api/auth/register` | `202 Accepted` | `{ "msg": "check your email" }` |
| Verify email and create the account | `GET` | `/api/auth/verify-email?token=<token>` | `201 Created` | `{ "msg": "User registered successfully", "userId": "1" }` |

- The Nest application uses the `/api` global prefix.
- Local default backend origin: `http://localhost:3000`. The listening port can be changed with `NESTJS_PORT`; use the backend origin configured for your environment.
- Send registration as `Content-Type: application/json`.
- Neither endpoint requires an access token.
- Success responses use **`msg`**, while error responses use **`message`**.
- `userId` is a **string**, because the database ID is a `BigInt`. Keep it as a string in the frontend.
- Neither endpoint returns access/refresh tokens, sets an authentication cookie, or logs the user in. Login is a separate step.

## 2. Registration request and validation

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "username": "syna_test_001",
  "email": "syna_test_001@example.com",
  "password": "SecurePass123!"
}
```

All three fields are required strings. Missing fields, `null`, wrong types, or invalid values produce `400 Bad Request`.

| Field | Normalization | Validation |
| --- | --- | --- |
| `username` | Converted to lowercase before validation and use | Nonempty; 2–50 characters; no whitespace anywhere |
| `email` | Converted to lowercase before validation and use | Nonempty; valid email according to `@IsEmail()`; maximum 50 characters |
| `password` | Preserved exactly; never lowercased or trimmed | 8–50 characters; at least one lowercase letter, uppercase letter, number, and symbol; no whitespace anywhere; must not contain the full username, ignoring case |

Additional details for form validation:

- Username and email are **not trimmed**. For example, `" alice "` fails the whitespace check and `"alice@example.com "` fails email validation. If the UI trims these fields, do so explicitly before submission.
- Spaces, tabs, and line breaks are rejected in usernames and passwords by `/^\S+$/`.
- The username has no letters/digits/underscore allowlist. Punctuation and other non-whitespace characters are not explicitly blocked by this DTO; do not describe the backend rule as “alphanumeric only.”
- Password strength uses `@IsStrongPassword()`. The installed validator counts ASCII `a–z`, `A–Z`, and `0–9` for the respective requirements. Use common symbols such as `!`, `@`, or `#` in examples; an arbitrary Unicode character does not necessarily satisfy the symbol rule.
- The personal-information check only searches for the **full username** as a substring of the password, ignoring case. It does not check the email address or other personal information.
- Example: username `"Alice"` becomes `"alice"`; password `"SuperALICE123!"` is rejected with `Password must not contain username`.
- A short username can match part of a longer password. For username `"ab"`, `"ZabCdef123!"` is rejected.
- Unknown JSON properties are rejected, rather than silently removed, because the global validation pipe uses `whitelist: true` and `forbidNonWhitelisted: true`.
- Do not send `confirmPassword`, `confirm`, `bio`, roles, profile fields, or frontend state. Password confirmation belongs to the frontend; submit only `username`, `email`, and `password`.
- Validation can report multiple errors at once. The response does not include a structured field-to-error map.

## 3. What happens after submitting registration

The request passes through these stages, in order:

1. **DTO transformation and validation:** lowercase username/email, then enforce the rules above. Invalid data stops here with `400`.
2. **Password/username check:** reject a password containing the full username with `400`.
3. **Redis duplicate cache:** if Redis is ready, check the `names` and `mails` sets for existing accounts. A hit returns `409`. Read errors in these cache checks are ignored so the database checks can still run.
4. **PostgreSQL duplicate checks:** look up username first, then email. A match returns `409`.
5. **Prepare pending registration:** generate a random token from 32 bytes, encoded as 64 hexadecimal characters. Hash the token with SHA-256 and hash the password with bcrypt, cost `12`.
6. **Store temporary data in Redis:** save `{ username, email, passwordHash }` under `registration:<tokenHash>`, with a TTL of **900 seconds / 15 minutes**. The raw password is not stored in the pending record.
7. **Send verification email:** send an email containing the raw token in a verification link. This call is awaited.
8. **Return `202`:** return exactly:

   ```json
   {
     "msg": "check your email"
   }
   ```

At this point, there is no new account in PostgreSQL. The frontend should show a “Check your email” state, explain that the link expires after 15 minutes, and avoid entering an authenticated state. SMTP acceptance does not guarantee delivery to the inbox; the user may need to check spam.

The token is sent through email only. The registration response contains no token, verification URL, `userId`, or expiry timestamp. The 15-minute TTL starts when Redis stores the pending registration, before the verification email finishes sending.

## 4. Email verification and account creation

The email link is constructed by the backend as:

```text
<origin from NEST_URL>/api/auth/verify-email?token=<64-character-hex-token>
```

`NEST_URL` must be reachable by the person opening the email. Because the path begins with `/`, it replaces any path component in that configured URL.

```http
GET /api/auth/verify-email?token=<token-from-email>
```

This endpoint expects a query parameter, not a JSON body. Its current implementation:

1. Rejects a missing or empty token with `400`.
2. Hashes the supplied token with SHA-256.
3. Atomically reads **and deletes** its pending registration using Redis `GETDEL`.
4. Rejects a missing record with `400`: the token is invalid, expired, or already consumed.
5. Creates `users` and its related `normal_users` record in one Prisma nested write. The username goes into `users.name`, the email into `normal_users.mail`, and the bcrypt hash into `normal_users.password`. The new user has an empty bio and database defaults for the other profile fields.
6. Tries to add the username/email to the Redis duplicate cache. Cache-update errors are logged and do not undo account creation.
7. Sends a welcome email. This call is awaited after account creation.
8. Returns:

   ```json
   {
     "msg": "User registered successfully",
     "userId": "1"
   }
   ```

The Nest endpoint returns **JSON directly** and does not redirect. A link targeting the backend origin displays that response. The frontend now has a `/verify-email` page and Vite development middleware: when `NEST_URL` points to the frontend origin, browser HTML navigation to `/api/auth/verify-email` redirects to `/verify-email`, which sends the JSON verification request through the Vite proxy. That development redirect is not part of the static build; deployment needs corresponding web-server routing or an agreed change to emailed URLs.

**A token is consumed before the database write and welcome email.** A later failure does not restore it. Do not automatically retry verification on page reload, mount effects, or network errors: a second request may return an invalid-token error even if the first request created the account.

## 5. Error responses

Business exceptions normally use this envelope:

```json
{
  "message": "Password must not contain username",
  "error": "Bad Request",
  "statusCode": 400
}
```

DTO validation returns `message` as an array. For example, adding an unsupported `confirmPassword` property to an otherwise valid body produces:

```json
{
  "message": ["property confirmPassword should not exist"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Support both `string` and `string[]` for `message`; do not assume `error` exists on every failure. Unexpected server errors normally return:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

### Registration errors: `POST /api/auth/register`

| Status | Message / source | Frontend interpretation |
| --- | --- | --- |
| `400` | DTO validation messages, including `user must not contain whitespace` and `password must not contain whitespace` | Ask the user to correct the inputs; there can be multiple messages |
| `400` | `Password must not contain username` | Ask for a different password |
| `409` | `User already registered` | Username found in Redis duplicate cache |
| `409` | `Username already taken` | Username found in PostgreSQL |
| `409` | `Email already registered` | Email found in Redis cache or PostgreSQL |
| `503` | `Database temporarily unavailable` | Email lookup failed with the explicitly handled Prisma `P1001` error; username lookup currently rethrows database errors without this mapping |
| `503` | `Registration service temporarily unavailable` | Saving the pending registration in Redis failed |
| `500` | Normally `Internal server error` | Unhandled failure, including verification-mail errors or database errors outside the explicit mapping |

If several checks fail, the first reached check determines the response. DTO validation runs before the custom password check; Redis checks run before database checks, with username checked before email within each layer. The same taken username can therefore produce different text depending on the cache state. Handle these as the same username-conflict UX.

### Verification errors: `GET /api/auth/verify-email`

| Status | Message / source | Frontend interpretation |
| --- | --- | --- |
| `400` | `Verification token is required` | Query parameter is absent or empty |
| `400` | `Verification token is invalid or expired` | Unknown, expired, modified, or already consumed token; these cases are not distinguished |
| `409` | `Username or email already registered` | Database uniqueness conflict at creation time; an earlier request may have completed first |
| `503` | `Database temporarily unavailable` | Creation failed with a recognized Prisma `P1001` or `P1002` error, and the follow-up failure email was sent successfully |
| `500` | Normally `Internal server error` | Unhandled failure, including Redis `GETDEL`, malformed non-string token input, welcome-email failure, or failure-email delivery failure |

On the handled database-creation outage path, the backend attempts to email the user that the previous verification link is invalid and they should register again. If sending that email fails, the mail error escapes instead of returning the intended `503`.

There are no stable machine-readable business error codes. Use HTTP status plus the known message strings where necessary; keep a general fallback for other responses and transport failures.

## 6. Edge cases and actual guarantees

| Situation | Current behavior | What the frontend should do |
| --- | --- | --- |
| Username/email differ only in case on these registration requests | Both are lowercased before lookups and storage | Explain that username/email are normalized; preserve password casing |
| User tries to log in after `202`, before verification | Account has not been created; pending data is not a login account | Keep the user on “Check your email”; login can only succeed after creation |
| Register again with the same details before verifying | Pending registrations do not reserve a username/email. A new token and pending record can be created, with another email | Disable repeated submits while a request is running; do not interpret another `202` as account creation |
| Several links exist for the same pending details | New requests do not invalidate older tokens. Each has its own TTL | Do not claim that only the latest email link works |
| One of several competing links is verified | First successful creation wins; other pending links can later fail with `409` | Offer login if the user already completed registration, or registration with different details if needed |
| Two registrations race for the same username/email | Both may pass prechecks and return `202`; uniqueness is enforced when accounts are created during verification | A `202` does not guarantee the username/email will still be available at verification time |
| Two requests verify the exact same token | Atomic `GETDEL` gives pending data to at most one request; the other sees an invalid/expired token | Send verification once and avoid automatic retries; the first request may still fail later |
| Link expires, is opened twice, or is modified | Normally `400` with the same invalid/expired message | Offer login if already verified, or a fresh registration attempt if still needed |
| Email scanner or link preview requests the verification URL | Any real `GET` can consume the token and create the account; there is no confirmation step | Do not prefetch the link or call the endpoint just to test whether a token is valid |
| Redis duplicate-cache lookup fails | Those read errors are ignored; database lookup proceeds | No special cache handling is needed in the UI |
| Redis cannot save pending data | Registration returns `503`; verification email is not sent by that request | Show a temporary-service error and let the user retry later |
| Redis fails while reading a verification token | Error is not mapped to a dedicated service response; it can produce `500` | Show a general failure; do not assume the token or account state is recoverable from this response |
| Verification email fails after Redis storage | Registration can return `500` while pending data still exists until TTL expiry | Do not assume the request had no side effects; allow a deliberate retry |
| Database creation fails after token consumption | Old token is already gone; a recognized unique conflict gives `409`, recognized connection failures attempt a failure email | Reopening the same link cannot redo creation; a new registration is needed if no account exists |
| Redis cache update fails after creation | Failure is caught; account creation remains successful and welcome email is still attempted | Handle the final response normally |
| Welcome email fails after account creation | Verification can return `500` even though the account exists; the token is already consumed | Offer login; do not state that the account definitely was not created |
| Browser times out or connection drops | Frontend cannot tell which backend steps completed | Show an uncertain-result message and provide deliberate recovery actions |
| User wants another verification email | No separate resend endpoint or cooldown/rate limiter is implemented in this registration flow | Repeating registration is the available request path while details are still unused; any UI cooldown is only a UI measure |

The token query parameter has no DTO or explicit hex/length validation. Send exactly the single token value received in the email, URL-encoded. A different ordinary string generally fails the Redis lookup; repeated/nested query parameters can produce unsupported types and an unhandled error.

## 7. Suggested frontend flow

1. Validate the form and password confirmation locally using the rules above. Treat backend validation as authoritative.
2. Send only the three registration fields. Disable the submit button while awaiting the response.
3. On `202`, show “Check your email to complete registration. The link expires in 15 minutes.” Keep the user unauthenticated and clear the password from form state when it is no longer needed.
4. On `400`, show validation messages; on `409`, show the relevant conflict and a login option where appropriate; on `503`, offer a later retry. On `500` or transport failure, show a general failure without promising that no pending registration exists.
5. The backend verification URL returns JSON; the frontend verification page can call it through the configured proxy. After a successful `201`, the user can go to login. Call verification once per token and require explicit recovery after an uncertain result.
6. If verification fails after a possible account-creation attempt, offer login as well as starting registration again. Reusing the old link cannot restore consumed pending data.

Example registration request and minimal response handling:

```js
// apiOrigin must be your configured backend origin, without a trailing slash.
async function requestRegistration(apiOrigin, { username, email, password }) {
  let response;

  try {
    response = await fetch(`${apiOrigin}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
  } catch {
    // A transport failure does not prove the backend did nothing.
    return { kind: 'network-error' };
  }

  const body = await response.json().catch(() => null);

  if (response.status === 202) {
    return { kind: 'pending-email', message: body?.msg ?? 'check your email' };
  }

  const messages = Array.isArray(body?.message)
    ? body.message
    : [body?.message ?? 'Registration could not be completed'];

  return { kind: 'api-error', status: response.status, messages };
}
```

Deployment detail: `main.ts` currently has no `enableCors()` configuration, and the checked-in main Nginx template does not proxy `/api` to Nest. Vite provides a development `/api` proxy, targeting `BACKEND_URL` or `http://localhost:3000` by default. Production needs a working same-origin proxy or an agreed CORS configuration for a separate API origin, plus the verification-page routing described above.

## 8. Integration scenarios to verify

These are proposed checks derived from the implementation, **not tests executed for this document**. Use a controlled mailbox and test database; successful verification creates an account.

- Valid details → `202`; pending account cannot log in; email link → `201` with a string `userId`.
- Mixed-case username/email → lowercase identity after verification; password remains case-sensitive.
- Missing fields, wrong types, unknown fields, invalid email, length limits, weak password, and whitespace → `400`.
- Strong password containing the full username in different casing → `400` with the custom message.
- Existing username/email → `409`; allow both username-conflict messages depending on cache state.
- Missing token → required-token `400`; modified, expired, and reused token → invalid/expired `400`.
- Repeated pending registration → separate links; verify one, then verify another with the same identity → creation followed by conflict.
- Concurrent verification of the same token → at most one request receives pending data.
- Concurrent verification of different tokens competing for username/email → at most one account with that unique identity, with conflicts mapped where the Prisma error handler recognizes them.
- Redis outage during pending storage → `503`; outage during verification → general server-error handling.
- Verification-email failure → registration failure with pending data potentially retained.
- Welcome-email failure → verification failure with the account already created; login remains the recovery option.
- Real browser origin/proxy setup and the reachability of `NEST_URL` from the email recipient's browser.

## 9. Implementation references

- [Route methods and success statuses](../src/auth/auth.controller.ts)
- [Global prefix and validation pipe](../src/main.ts)
- [Request DTO and normalization](../src/dto/RegisterDto.ts)
- [Password/username rule](../src/auth/custom-func/lib.ts)
- [Registration checks and pending-registration call](../src/auth/auth.service.ts)
- [Pending data, TTL, token consumption, and verification](../src/email-verification/email-verification.service.ts)
- [Database lookups, nested creation, cache updates, and error mapping](../src/users/user.service.ts)
- [Redis connection settings and GETDEL wrapper](../src/redis/redis.service.ts)
- [Verification URL and email delivery](../src/mail/mail.service.ts)
- [Database fields and unique constraints](../prisma/schema.prisma)
- [Current Nginx main template](../../../devops/nginx/templates/main.conf.template)
- [Frontend development proxy and verification redirect](../../../frontend/vite.config.js)
