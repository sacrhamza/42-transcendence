# Token Refresh API — Frontend Integration Guide

This document describes the current refresh controller and service in this working tree. A valid refresh rotates the persisted session and replaces both cookies, while preserving the original refresh expiration. The description is based on code inspection, not executed integration tests.

Subsequent [live checks](api-test-results.md) verified authenticated refresh, a changed refresh token/`jti`, unchanged absolute refresh expiry, and rejection of the old token after rotation.

`main.ts` registers `app.use(cookieParser())`, so the controller can read incoming refresh cookies through `req.cookies`. Cookie delivery still depends on browser policy and API routing. See the [API index](README.md), [login](api-auth-login.md), and [logout](api-auth-logout.md).

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Success status | Success body |
| --- | --- | --- | --- | --- |
| Rotate the refresh session and issue new cookies | `POST` | `/api/auth/refresh` | `200 OK` | `{ "message": "Tokens is refreshed successful" }` |

- Requires the `refresh_token` cookie; an access cookie is not required and may already be expired.
- The route has no `AuthenticationGuard` and does not read a bearer header.
- There is no request-body DTO. A JSON `{ "refreshToken": "..." }` is not a supported token source.
- The success message above preserves the exact current wording. No tokens, `userId`, role, or expiration timestamp are returned in JSON.

## 2. Request and cookie validation

```http
POST /api/auth/refresh
Cookie: refresh_token=<application-refresh-jwt>
```

Do not include a body. Browser clients should let the browser send its HTTP-only cookie using the configured API origin and credentials policy.

The controller rejects `undefined` or a non-string cookie with `401 Missing refresh token`. An empty string passes that initial type check but fails JWT verification with `401 Invalid refresh token`.

The refresh cookie is created by normal login or the 42 callback with `HttpOnly; Secure; SameSite=Lax; Path=/api/auth`. Browser cookie restrictions still apply; setting `credentials: 'include'` does not bypass them.

## 3. Backend processing

1. Read `req.cookies?.refresh_token` and apply the controller's string check.
2. Verify the JWT with `JWT_REFRESH_SECRET`, including its expiration. Any exception in this verification block maps to `401 Invalid refresh token`.
3. Find `refresh_sessions` by the payload's `jti`. A missing row gives the same `401`.
4. Compare `session.fk_user_id.toString()` with payload `sub` and check that the database `expires_at` is still in the future. A mismatch/expired row gives the same `401`.
5. Use bcrypt to compare the supplied refresh token with `session.token_hash`. A failed comparison gives the same `401`.
6. Sign a five-minute access JWT with the existing payload's `sub` and `role` using `JWT_ACCESS_SECRET`.
7. Generate a new UUID `jti` and sign a new refresh JWT with the existing `sub`, role, and **the same `exp`** using `JWT_REFRESH_SECRET`. There is no new `expiresIn: '7d'` on this path.
8. Hash the new refresh token with bcrypt, cost `12`.
9. Atomically update the session with `updateMany` filtered by both its database `id` and old `jti`. Replace `jti`, `token_hash`, and `expires_at`. The row ID, user ID, and `created_at` remain unchanged.
10. If the update count is not exactly one, return `401 Session expired or already rotated`.
11. Return the new tokens and original expiration to the controller. It calculates `remaining_time = expiration - now`; if this is nonpositive, return `401 Session expired`.
12. Set both cookies and return the exact success body:

    ```json
    {
      "message": "Tokens is refreshed successful"
    }
    ```

This flow works with both `normal_user` and `fortytow_user`; it copies the verified refresh payload's role. There is no account lookup or deactivation check during refresh, and no Prisma transaction spanning signing, rotation, and response delivery.

## 4. Cookies and expiration

| Cookie | Flags | Path | New `maxAge` |
| --- | --- | --- | --- |
| `access_token` | `HttpOnly; Secure; SameSite=Lax` | `/` | 5 minutes |
| `refresh_token` | `HttpOnly; Secure; SameSite=Lax` | `/api/auth` | Original refresh expiry minus controller time |

For example, if a login session has two days left, refreshing issues another access JWT but leaves approximately two days on the refresh session. Refreshing repeatedly cannot extend the seven-day deadline established by login/42 callback.

The new access JWT has a full five-minute lifetime even if the refresh session expires sooner. The access guard checks JWT validity without consulting the session, so session expiration does not itself revoke an already issued access token.

Old refresh JWTs normally stop working because the session's `jti` changes. Rotation does not revoke other login sessions or access JWTs already issued for this one.

## 5. Error responses

```json
{
  "message": "Invalid refresh token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

| Status | Message / source | Interpretation |
| --- | --- | --- |
| `401` | `Missing refresh token` | Cookie is absent, unparsed, or not a string |
| `401` | `Invalid refresh token` | JWT verification failed, session missing, wrong owner, expired database session, or bcrypt comparison failed |
| `401` | `Session expired or already rotated` | Conditional session update did not affect exactly one row; a concurrent request may have won |
| `401` | `Session expired` | Original expiration passed before the controller could set cookies; rotation may already have completed |
| `503` | `Database temporarily unavailable` | Session lookup or rotation threw a caught database error, regardless of its specific Prisma code |
| `500` | Normally `Internal server error` | Unhandled signing, hashing, malformed payload handling, or other runtime failure outside the JWT verification catch |

Ordinary business errors use `{ message, error, statusCode }`; unhandled `500` responses normally contain only `statusCode` and `message`. There are no custom business error codes. The payload has TypeScript types but no runtime DTO validation for `sub`, `jti`, `role`, and `exp`; do not assume every malformed signed payload is mapped cleanly to `401`.

The controller does not clear cookies on failure. A `503` is not a reason to immediately erase local application state; an invalid/expired session ultimately requires login.

## 6. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| Access JWT expired but refresh is valid | Refresh does not require access authentication | Refresh once, then retry the original protected request once |
| Two refresh requests use the same old session | Both may read it, but only one conditional update can win; the other gets `401` | Share one in-flight refresh operation across callers |
| Another tab rotates the session | A request already carrying the previous cookie can fail | Coordinate tabs where needed; avoid treating every race as a new credential failure |
| Old refresh token is replayed after rotation | Its `jti` has no matching row | Expect `401`; do not reuse saved token values |
| Response is lost after the session changes | Browser may keep the old cookie, which no longer matches the session | Avoid blind retries; offer deliberate re-login when recovery fails |
| Session expires during processing | Rotation may succeed before the final controller `401` | Re-login; refresh does not extend the deadline |
| Account was deactivated after login | Refresh does not inspect `users.deleted` | Do not claim deactivation is enforced here |
| Caller sends a token in JSON or `Authorization` | Neither is read by this route | Rely on the refresh cookie |
| Logout races with refresh | The old `(userId, jti)` deletion may miss the newly rotated row | Do not send refresh and logout concurrently |

## 7. Suggested frontend flow

With working API routing, use a single shared refresh promise so multiple failed requests do not rotate the same session independently. Avoid routing a failed refresh back into its own retry interceptor.

```js
let pendingRefresh;

export function refreshSession() {
  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      const body = await response.json().catch(() => null);

      if (response.status !== 200) {
        const error = new Error(body?.message ?? 'Refresh could not be completed');
        error.status = response.status;
        throw error;
      }
      return body;
    })().finally(() => {
      pendingRefresh = undefined;
    });
  }
  return pendingRefresh;
}
```

This coordinates calls in one JavaScript context only. Multiple tabs need their own coordination. Use `401` to offer login when the session cannot be recovered; handle `503` and transport failures without claiming that rotation definitely did not occur. The current controller has no active protected user endpoint to use as a post-refresh profile request.

## 8. Integration scenarios to verify

These are proposed checks, **not executed tests**:

- Incoming refresh cookie → parsed into `req.cookies.refresh_token`; no cookie → `401 Missing refresh token`.
- Valid normal/42 refresh → `200`, new cookies, same session row ID, new `jti`, unchanged absolute expiration.
- Missing cookie → missing-token `401`; empty, expired, modified, or wrong-secret token → invalid-token `401`.
- Missing row, owner mismatch, expired row, or nonmatching token hash → invalid-token `401`.
- Replay old token after successful rotation → `401`; two concurrent refreshes → at most one successful conditional update.
- Session lookup/update errors → `503`; signing/hashing failures → general `500` handling.
- Session deadline passes before controller response → `401 Session expired` with possible prior rotation.
- Browser cookie acceptance, refresh after access expiry, and deliberate recovery after a lost response.

## 9. Implementation references

- [Refresh controller and remaining-lifetime cookie logic](../src/auth/auth.controller.ts)
- [JWT checks, rotation data, and original expiry](../src/auth/auth.service.ts)
- [Session lookup and conditional update](../src/auth/SessionService/session.service.ts)
- [Bootstrap and cookie-parser registration](../src/main.ts)
- [Access-token guard](../src/guards/authentication.guard.ts)
- [Session schema](../prisma/schema.prisma)
