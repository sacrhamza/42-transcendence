# Logout API — Frontend Integration Guide

This document describes the current logout implementation in this working tree. Logout clears the two authentication cookies and, when it receives a valid parsed refresh token, deletes the matching PostgreSQL session. It signs out one supplied session rather than every device. The description is based on code inspection, not executed integration tests.

Subsequent [live checks](api-test-results.md) verified authenticated logout, removal of both cookies from the test cookie jar, and rejection of that session's last valid refresh token after logout.

`main.ts` registers `app.use(cookieParser())`, so incoming refresh cookies are available through `req.cookies` for the server-session deletion flow below. See the [API index](README.md), [login](api-auth-login.md), and [refresh](api-auth-refresh.md).

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Success status | Success body |
| --- | --- | --- | --- | --- |
| Delete the matching refresh session and clear cookies | `POST` | `/api/auth/logout` | `200 OK` | `{ "message": "Logout successful" }` |

- Does not require a valid access JWT; no authentication guard is attached.
- Reads only `req.cookies?.refresh_token`. JSON and bearer-header tokens are not used.
- No request body or DTO is defined.
- A missing or invalid refresh token normally still leads to `200` and cookie clearing.
- `200` does not prove that a server-side session was found or deleted.

## 2. Request

```http
POST /api/auth/logout
Cookie: refresh_token=<application-refresh-jwt>
```

The cookie is optional for the controller. A browser client should send credentials to allow both its refresh cookie and cookie-clearing response to participate in the configured API flow:

```js
fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

Use the working API origin/proxy. Secure-cookie and `SameSite=Lax` restrictions still apply; JavaScript cannot read the HTTP-only token or force the browser to send a blocked cookie.

## 3. Backend processing

1. Read `req.cookies?.refresh_token`.
2. If it is a nonempty string, call `AuthService.logout(token)`. Otherwise skip server-session deletion.
3. Verify the refresh JWT with `JWT_REFRESH_SECRET`. If verification throws, the service returns without throwing; cookie clearing continues. Expired tokens follow this same path.
4. For a verified token, call `deleteSession(payload.jti, BigInt(payload.sub))`.
5. Delete rows from `refresh_sessions` matching **both** `jti` and `fk_user_id`. Zero matching rows is accepted. There is no bcrypt token-hash comparison in logout.
6. After the awaited service call succeeds or is skipped, clear `access_token` with `Path=/` and `refresh_token` with `Path=/api/auth`.
7. Return:

   ```json
   {
     "message": "Logout successful"
   }
   ```

The controller uses `res.clearCookie()` with the original cookie names and paths. Its clear calls pass only `path`; they do not explicitly repeat `httpOnly`, `secure`, or `sameSite`. No `Domain` is specified for either creation or clearing. Matching name/path/host is essential when checking browser behavior.

The account is not deleted or marked deactivated, and no email is sent. The operation does not use Redis, delete other user sessions, or maintain an access-token denylist.

## 4. Session revocation and access-token limits

When the matching row is deleted, that refresh token can no longer find its session during refresh. The endpoint does not invalidate the cryptographic signature of an existing access JWT. [AuthenticationGuard](../src/guards/authentication.guard.ts) verifies the access JWT without querying sessions, so a copied access token can remain usable until its five-minute expiry.

Clearing the browser cookie removes the browser's normal way of sending that token. Other devices' session rows remain untouched. A repeated logout with no matching row still succeeds; deleting all sessions for a user is not an implemented endpoint.

An expired refresh JWT is not used to delete its row because verification fails first. There is no expired-session cleanup job in the inspected source.

## 5. Error responses

Example database error:

```json
{
  "message": "Database temporarily unavailable",
  "error": "Service Unavailable",
  "statusCode": 503
}
```

| Status | Message / source | Interpretation |
| --- | --- | --- |
| `200` | `Logout successful` | Cookie clearing was reached; session deletion may have succeeded, matched zero rows, or been skipped |
| `503` | `Database temporarily unavailable` | The session delete threw; all caught Prisma/database errors in this method map here |
| `500` | Normally `Internal server error` | Unhandled runtime error, such as conversion of a malformed signed `sub` to `BigInt` |

Missing/empty/non-string cookies and invalid/expired JWTs do not have an explicit `401` response in this path. JWT verification exceptions are swallowed by the logout service.

**Cookie clearing happens after deletion.** If deletion throws `503`, or an unhandled error occurs before the clear calls, this request does not clear cookies. A frontend must not interpret an error as confirmed server-session revocation.

Business errors normally use `{ message, error, statusCode }`; unhandled errors normally omit `error`. Keep a fallback for transport and infrastructure errors.

## 6. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| No cookie, empty cookie, or cookie not parsed | Skip deletion; clear cookies; return `200` | Do not equate success with server-row deletion |
| Modified/expired refresh JWT | Verification fails; skip deletion and still clear cookies | Accept success without claiming the row was removed |
| Valid JWT whose session was already deleted | `deleteMany` matches zero; return `200` | Repeated logout is accepted |
| Valid current token | Delete its matching session and clear cookies | Clear local user state after success |
| Session database unavailable | Return `503` before clearing cookies | Offer a deliberate retry; sign-out is not confirmed |
| Access JWT was copied elsewhere | It is not revoked by this operation | Do not promise immediate invalidation of every token |
| Other devices have sessions | Their rows are not selected | Do not claim logout-all-devices behavior |
| Refresh and logout run concurrently | Refresh can rotate the `jti` before deletion; logout can then match zero rows | Stop automatic refresh and serialize logout with pending refresh |
| Response is lost | Deletion/clearing may or may not have completed | Report an uncertain result and allow deliberate retry |
| Different cookie paths were used outside this controller | These clear calls only target `/` and `/api/auth` | Verify actual cookie scope during integration |

## 7. Suggested frontend flow

1. Stop new authenticated work and avoid starting refresh while logout is running.
2. If a refresh is in flight, coordinate completion before sending logout so the browser uses its latest refresh cookie.
3. Send `POST` with browser credentials and no body.
4. On the exact `200` success contract, clear local user/profile state and navigate to login.
5. On `503` or network failure, show that logout could not be confirmed and allow a deliberate retry. Browser JavaScript cannot directly remove an HTTP-only cookie.

```js
async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  const body = await response.json().catch(() => null);

  if (response.status === 200 && body?.message === 'Logout successful') {
    return { kind: 'signed-out' };
  }
  return {
    kind: 'unconfirmed',
    status: response.status,
    message: body?.message ?? 'Logout could not be confirmed',
  };
}
// The caller also handles fetch rejection as an uncertain result.
```

## 8. Integration scenarios to verify

These are proposed checks, **not executed tests**:

- Incoming refresh cookie → parsed into `req.cookies.refresh_token` and passed to the logout service.
- Valid normal/42 token → matching row removed, both cookie paths cleared, `200`.
- Missing/empty/invalid/expired token → `200` and clear calls; deletion skipped as described above.
- Valid token with no matching row or repeated logout → `200`.
- Other sessions for the same user → remain in the database.
- Session delete failure → `503`; verify the controller did not issue cookie clears.
- After successful deletion, refresh with the old token → `401`; an existing access JWT remains valid until its own expiry.
- Browser cookie deletion and coordinated refresh/logout behavior.

## 9. Implementation references

- [Logout controller and exact clear-cookie paths](../src/auth/auth.controller.ts)
- [Refresh-token verification and logout service](../src/auth/auth.service.ts)
- [Session deletion and database error mapping](../src/auth/SessionService/session.service.ts)
- [Bootstrap](../src/main.ts)
- [Access guard without session lookup](../src/guards/authentication.guard.ts)
- [Session schema](../prisma/schema.prisma)
