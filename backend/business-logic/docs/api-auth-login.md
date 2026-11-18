# Login API — Frontend Integration Guide

This document describes the current email/password login implementation in this working tree. Login authenticates an existing normal account, creates a refresh session in PostgreSQL, and sets two HTTP-only cookies. It does not return JWTs or a user profile in JSON. The guide describes the implementation; selected executed checks are recorded in the [live test report](api-test-results.md).

See the [API index](README.md), [registration](api-auth-register.md), [refresh](api-auth-refresh.md), and [logout](api-auth-logout.md) guides for related flows. A 42 account uses [Continue with 42](api-auth-42.md).

**Live recheck passed:** After the invalid `users.name` selection was moved to `normal_users.name`, login with a user-supplied existing account returned `200` and both authentication cookies. Unknown-email and incorrect-password requests returned `401 Invalid credentials`. The resulting session successfully refreshed and logged out; old and logged-out refresh tokens were rejected. See the [executed API check](api-test-results.md).

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Success status | Success body |
| --- | --- | --- | --- | --- |
| Authenticate by email and password | `POST` | `/api/auth/login` | `200 OK` | `{ "message": "Login successful" }` |

- No existing access or refresh token is required.
- Send JSON containing only `email` and `password`.
- Account creation must already have completed. `202` from registration is not enough; pending Redis data is not an account.
- Success sets `access_token` and `refresh_token` cookies. There is no `userId`, role, profile, token, or expiry field in the response body.

## 2. Request and validation

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "syna_test_001@example.com",
  "password": "SecurePass123!"
}
```

| Field | Backend rule | Normalization |
| --- | --- | --- |
| `email` | Required; nonempty; `@IsEmail()` | No lowercase conversion or trimming |
| `password` | Required; nonempty string | Preserved exactly |

Missing fields, `null`, invalid email, wrong types, and extra properties return `400`. For example, do not send `username`, `rememberMe`, or `confirmPassword`.

Login does not repeat registration's password-strength, whitespace, length, or username-in-password checks. It compares the supplied password with the stored hash. Registration lowercases email, but `LoginDto` does not. The lookup uses the provided email with no explicit case-insensitive option; send the registered lowercase address rather than relying on mixed-case matching. A frontend may deliberately trim/lowercase the email; it must preserve the password.

## 3. Backend processing

1. Transform/validate `LoginDto` through the global validation pipe.
2. Query `normal_users` by `mail`, selecting its password hash, `normal_users.name`, and related `users.id` and `users.deleted`.
3. If no normal account exists, return `401 Invalid credentials`. An unverified registration or a 42-only account does not satisfy this lookup.
4. Check `users.deleted`. If true, return `403 Account deactivated` **before** checking the password.
5. Compare the exact password using bcrypt. A mismatch returns `401 Invalid credentials`.
6. Sign an access JWT with `{ sub: "<user-id>", role: "normal_user" }`, `JWT_ACCESS_SECRET`, and a five-minute lifetime.
7. Sign a refresh JWT with the same `sub`/role, a random UUID `jti`, `JWT_REFRESH_SECRET`, and a seven-day lifetime. JWT timestamps are added by the signing library.
8. Verify that newly signed refresh JWT to obtain its `jti` and `exp`. Convert `exp` to a database expiration date.
9. Hash the refresh JWT with bcrypt, cost `12`, and insert a `refresh_sessions` row containing `fk_user_id`, `jti`, `token_hash`, and `expires_at`.
10. Only after the service succeeds, set both cookies and return:

    ```json
    {
      "message": "Login successful"
    }
    ```

The JWT `sub` is the application user ID as a string. The selected `normal_users.name` is not used to construct the login response or tokens.

Each successful login creates a new session. There is no session limit, automatic deletion of older sessions, Redis session cache, or welcome email in this path.

## 4. Cookies and browser integration

| Cookie | Flags | Path | `maxAge` |
| --- | --- | --- | --- |
| `access_token` | `HttpOnly; Secure; SameSite=Lax` | `/` | `300000` ms / 5 minutes |
| `refresh_token` | `HttpOnly; Secure; SameSite=Lax` | `/api/auth` | `604800000` ms / 7 days |

No `Domain` is configured. Cookie lifetimes are set when the controller sends the response; JWT expiration was calculated earlier during signing. Authorization ultimately depends on JWT/session validity, not just whether a cookie still exists.

The browser processes `Set-Cookie`; frontend JavaScript neither reads the JWTs nor copies them to storage or an `Authorization` header. A `200` proves that the server completed login, but does not prove the browser accepted cookies. Secure-cookie rules and `SameSite=Lax` apply even with `credentials: 'include'`. Use a deployment whose HTTPS and origin setup support these options.

`main.ts` registers `app.use(cookieParser())`, making incoming cookies available to refresh/logout through `req.cookies`. A browser must still accept and send those cookies under the configured host/path/security rules. See the [shared integration constraints](README.md#current-integration-constraints).

There is no active `/me` or protected user route in this controller. Do not follow login with requests to the commented `/api/auth/user` or `/api/auth/users` examples. No CORS policy is enabled in Nest; Vite's `/api` proxy is the available development routing mechanism.

## 5. Error responses

Business error example:

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Validation error example:

```json
{
  "message": ["property rememberMe should not exist"],
  "error": "Bad Request",
  "statusCode": 400
}
```

| Status | Message / source | Frontend interpretation |
| --- | --- | --- |
| `400` | DTO messages such as `email must be an email`, `password must be a string`, `password should not be empty`, or unknown-property errors | Correct the submitted data; `message` can be an array |
| `401` | `Invalid credentials` | No matching normal account or incorrect password; these share a message |
| `403` | `Account deactivated` | The account is marked deleted; occurs before password verification |
| `503` | `Database temporarily unavailable` | Email lookup hit the recognized Prisma `P1001` case, or session creation failed for any reason caught by `SessionService` |
| `500` | `An unexpected error occurred` | Email lookup failed outside its explicit database-outage mapping |
| `500` | Normally `Internal server error` | Unhandled hashing, JWT, or other runtime error |

No rate limiter or lockout is implemented on this route, and it has no explicit `429` response. Infrastructure could introduce its own responses. Handle unknown statuses and network failures with a fallback; there are no custom business error codes.

## 6. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| Registration returned `202` but verification has not completed | No normal account exists yet; login returns `401` | Keep the email-verification step visible |
| Same email with different casing or surrounding spaces | Login does not normalize it | Normalize email deliberately before submission |
| Existing deactivated account with a wrong password | Deactivation check wins and returns `403` | Handle the account-state response |
| User logs in again or from another device | Another session row is created | Do not claim that earlier devices were signed out |
| Session insertion fails after JWT signing | Service returns `503`; controller does not reach cookie-setting code | Offer a deliberate retry later |
| Request fails after database insertion or response is lost | A server session may exist even if the UI saw no success | Treat the outcome as uncertain |
| Browser rejects cookies after `200` | Server login succeeded, but later cookie-based requests cannot authenticate | Inspect deployment/cookie behavior during integration |
| Account is deactivated after login | Login checks deactivation, but refresh and the access guard do not recheck it | Do not promise immediate invalidation of issued tokens |
| A 42-only account enters its provider email here | Login only queries `normal_users`; no automatic account linking exists | Use Continue with 42 |

## 7. Suggested frontend flow

1. Validate required email/password fields. Normalize only the email if the UI chooses to do so.
2. Disable repeated submission while awaiting the result.
3. Send only the two DTO fields, allowing browser cookie handling.
4. Accept the exact `200` success contract and navigate to the intended page. Do not expect profile data in this response.
5. Show a generic credentials message on `401`, deactivation on `403`, and a retry-later message on `503`. Support both string and array error messages.
6. Coordinate expired-access recovery through [refresh](api-auth-refresh.md); avoid multiple simultaneous refresh calls.

```js
async function login({ email, password }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const body = await response.json().catch(() => null);

  if (response.status === 200 && body?.message === 'Login successful') {
    return { kind: 'authenticated' };
  }

  return {
    kind: 'api-error',
    status: response.status,
    messages: Array.isArray(body?.message)
      ? body.message
      : [body?.message ?? 'Login could not be completed'],
  };
}
// Catch fetch/network errors in the caller; the server outcome can be uncertain.
```

This example assumes a working same-origin API route/proxy. For a separate backend origin, use its configured URL and the necessary server CORS policy.

## 8. Integration scenarios to verify

This is a proposed scenario checklist; consult the [live report](api-test-results.md) for the subset actually executed:

- Verified normal account and correct password → `200`, two cookies, and a new refresh-session row.
- Missing/wrong-type fields, invalid email, empty password, or extra `rememberMe` → `400`.
- Mixed-case email versus the stored lowercase address → observe the database match behavior; normalized frontend input succeeds.
- Unknown email, pending-only registration, incorrect password, or 42-only account → `401`.
- Deactivated account → `403`, including when the password is incorrect.
- Lookup `P1001` and session-write failures → `503`; other lookup errors → explicit `500`.
- Repeated successful logins → distinct sessions without revoking earlier ones.
- Browser cookie acceptance, refresh-cookie path, parsed incoming cookies, and behavior after access expiry.

## 9. Implementation references

- [Login route, cookies, and status](../src/auth/auth.controller.ts)
- [Login DTO](../src/dto/LogingDto.ts)
- [Credential checks and JWT creation](../src/auth/auth.service.ts)
- [Email lookup and error mapping](../src/users/user.service.ts)
- [Session insertion](../src/auth/SessionService/session.service.ts)
- [Bootstrap](../src/main.ts)
- [Access guard](../src/guards/authentication.guard.ts)
- [Schema](../prisma/schema.prisma)
