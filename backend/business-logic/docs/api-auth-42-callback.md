# 42 Callback API — Frontend Integration Guide

This document describes the current 42 OAuth callback implementation in this working tree. The callback obtains a trusted provider profile, finds or creates a 42 application account, creates a refresh session, sets application JWT cookies, and redirects to the frontend. It handles both first-time registration and later login. The description is based on code and locally installed Passport dependencies, not executed provider integration tests.

Start this flow through [GET /api/auth/42](api-auth-42.md). See the [API index](README.md), [refresh](api-auth-refresh.md), and [logout](api-auth-logout.md) for session behavior.

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Success status | Success result |
| --- | --- | --- | --- | --- |
| Complete provider authorization and establish application login | `GET` | `/api/auth/42/callback?code=<code>` | `303 See Other` | Authentication cookies and `Location: http://localhost:3001/feed` |

- Uses `@UseGuards(AuthGuard('42'))`; there is no application access-token requirement.
- The provider returns the browser here after authorization. This is not a JSON endpoint for accepting user-supplied profile data.
- No application JWT, profile, `userId`, or role is returned as success JSON or placed in the final redirect URL.
- The final destination is **hard-coded** as `http://localhost:3001/feed`. It does not use `NEST_URL`, `INTRA_CALLBACK`, or a caller-provided return URL.

## 2. Request and provider exchange

```http
GET /api/auth/42/callback?code=<authorization-code-from-provider>
```

`INTRA_CALLBACK` must point to this route through a reachable origin/proxy and agree with the provider application's callback configuration. The strategy also uses `INTRA_UID`, `INTRA_SECRET`, and scope `public`.

Before the controller method runs, Passport:

1. Checks for provider error parameters. An authorization denial stops before application account processing.
2. Reads the authorization code and exchanges it at the configured/default 42 token endpoint using the backend client credentials and callback URL.
3. Uses the provider access token to fetch the profile from the configured/default `/v2/me` endpoint.
4. Passes the profile to `fortytowstrategy.validate()`.
5. Places the returned object in `req.user` for `intraCallback()`.

The strategy returns:

| Application property | Source | Behavior |
| --- | --- | --- |
| `intraId` | `BigInt(profile.id)` | Provider ID; not the application's local user ID |
| `username` | `profile.username` | Provider login; no application lowercase/trim transformation |
| `email` | `profile.emails?.[0]?.value ?? null` | First provider email or `null` |
| `profileImage` | `profile._json?.image?.link ?? null` | Provider image URL or `null` |

`FortyTowUserDto` is used as a TypeScript shape here, not as a decorated HTTP-body validation DTO. `RegisterDto` rules do not run on the provider profile. A malformed profile can therefore fail during conversion or persistence rather than producing registration-style validation errors.

The provider's access/refresh tokens are not persisted by this flow or returned to the frontend. Application JWTs are generated separately after profile processing.

## 3. Existing-account lookup and first-time creation

The controller passes `req.user` to `AuthService.continueWith42()`:

1. Query `ft_users` using `intra_id` and select its related `users.id` and `users.deleted`.
2. If found, check `users.deleted`. A deactivated account returns `403 Account deactivated`; otherwise use the local `users.id` for login.
3. If absent, call `UsersService.createUserFortyTow()` for a nested Prisma creation:

   | Model | Values |
   | --- | --- |
   | `users` | Empty `bio`; provider image when non-null; generated ID and other schema defaults |
   | `ft_users` | Provider `intra_id`, provider username in `name`, relationship to the new `users` row |

4. Use the resulting local application user ID to create application tokens and a refresh session.

When the image is `null`, the create input uses `undefined`, allowing the schema's `profile_image: "default_image"` default. Existing users' names/images are not updated from the newest provider profile during login.

**The provider email is not stored in `ft_users` or `users` by this create path.** It is only available for an attempted creation-failure email. No normal password account is created, no email-verification token is issued, and no successful registration/welcome email is sent here.

Lookup uses the provider ID, not email. There is no linking/merging with `normal_users`, even when a normal account has the same email. Normal usernames and 42 usernames have separate unique constraints in their respective tables; `users` itself has no `name` column. The registration duplicate-cache sets are not updated by this path.

## 4. JWTs, refresh session, and cookies

After obtaining the local user ID:

1. Generate a UUID `jti`.
2. Sign an access JWT using `JWT_ACCESS_SECRET`, `{ sub: "<local-user-id>", role: "fortytow_user" }`, and `expiresIn: '5m'`.
3. Sign a refresh JWT using `JWT_REFRESH_SECRET`, the same `sub`/role plus `jti`, and `expiresIn: '7d'`.
4. Decode this newly signed refresh token to obtain its `exp`/`jti` and convert expiry to a database date.
5. Hash the refresh JWT with bcrypt, cost `12`.
6. Insert `refresh_sessions` with the local user ID, `jti`, token hash, and expiration.
7. Set cookies only after the service completes successfully:

   | Cookie | Flags | Path | `maxAge` |
   | --- | --- | --- | --- |
   | `access_token` | `HttpOnly; Secure; SameSite=Lax` | `/` | 5 minutes |
   | `refresh_token` | `HttpOnly; Secure; SameSite=Lax` | `/api/auth` | 7 days |

8. Return the redirect:

   ```http
   HTTP/1.1 303 See Other
   Location: http://localhost:3001/feed
   Set-Cookie: access_token=<application-access-jwt>; ...
   Set-Cookie: refresh_token=<application-refresh-jwt>; ...
   ```

The role is spelled **`fortytow_user`** in the implementation. Keep that exact value when interpreting application roles. JWT `sub` is a string containing the local `users.id`, not the provider `intraId`.

Account creation and session insertion are separate database operations. A session failure can leave a newly created account without returning login cookies. Every successful callback can create another session; earlier sessions are not revoked.

## 5. Browser and deployment behavior

The browser processes cookies on the callback response before following its redirect, subject to normal cookie policy. No `Domain` is specified, so cookies belong to the host that served the callback response. The final redirect does not move them to another host. Cookie matching is host/path based, not a per-port storage boundary.

`Secure` and `SameSite=Lax` still constrain acceptance/transmission; use an appropriate HTTPS and origin setup. For API calls from frontend JavaScript, use credentials as needed, working API routing, and server CORS configuration if origins differ. Nest currently enables no CORS, and the checked-in main Nginx template does not proxy `/api`.

The hard-coded local frontend URL must be accounted for outside local development. A successful `303` can lead to an unreachable or wrong frontend if that destination does not match deployment.

`main.ts` registers `app.use(cookieParser())`, allowing subsequent refresh/logout requests to read the authentication cookies sent by the browser. See the [shared integration constraints](README.md#current-integration-constraints) for routing and origin requirements.

The strategy does not enable OAuth `state` validation or PKCE; the locally installed OAuth strategy uses its null state store. No frontend error redirect or return-destination state is configured.

## 6. Error responses

If the guard or service fails, the controller does not reach its cookie-setting/success-redirect code. There is no custom `failureRedirect`; the browser can remain on a backend JSON error response.

```json
{
  "message": "Account deactivated",
  "error": "Forbidden",
  "statusCode": 403
}
```

| Status | Message / source | Interpretation |
| --- | --- | --- |
| `401` | `Unauthorized` | Passport authentication failure, including provider `error=access_denied` |
| `403` | `Account deactivated` | Existing local 42 account is marked deleted |
| `503` | `Database temporarily unavailable` | Provider-ID lookup/create hit a recognized Prisma `P1001`, or session insertion threw any caught database error |
| `500` | `An unexpected error occurred` | Provider-ID lookup/create failed outside its specific outage mapping, including uniqueness conflicts during creation |
| `500` | Normally `Internal server error` | Unhandled OAuth code exchange/profile error, malformed profile conversion, JWT/hash failure, or other runtime error |

Creation does **not** map `P2002` uniqueness errors to `409` in this flow. A duplicate provider ID or 42 username can therefore surface as the explicit `500` above. The normal-registration conflict mapping is different.

When 42 user creation fails and a provider email exists, the service attempts `sendFortyTwoRegistrationFailure(email, username)` before mapping the original error. This method catches/logs its own mail failures, preserving the original database error response. No such notification is sent when an earlier provider-ID lookup or later session insertion fails.

OAuth dependency errors have no custom application mapping. In the installed code, non-denial authorization errors carry a dependency `status`, and the current Nest filter normally treats these plain errors as an unhandled `500`; do not promise that provider-specific statuses/messages are forwarded. Business exceptions normally contain `{ message, error, statusCode }`; unhandled errors normally omit `error`.

If the callback has neither a code nor a provider error, the shared strategy redirects back to provider authorization (`302`) instead of returning a dedicated missing-code `400`. Reusing a code after it has been exchanged can fail at the provider; start a new flow for a deliberate retry.

## 7. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| First valid 42 login | Create local account, then session, cookies, and `303` | Treat this as registration plus login |
| Returning provider ID | Reuse local account and create another session | Same Continue with 42 button |
| Provider changed username/image | Existing local profile is not updated here | Do not promise automatic profile synchronization |
| Normal account shares the provider email | No email-based linking; a separate 42 account can be created | Do not present this as linking an existing account |
| Provider email is missing | Account creation can proceed; failure notification is skipped | Do not require a frontend email form for this callback |
| Provider image is missing | Database default is used | Support the default-image value |
| Two first-time callbacks race | Both can miss lookup; unique constraints decide creation; losing create maps to `500` | Retry through a fresh authorization flow |
| Account creation succeeds but session creation fails | Account remains; response is normally `503`, without new login cookies | A later fresh flow can find the existing account |
| Failure email cannot be delivered | Mail error is caught; original creation error remains | Handle the database error response |
| Browser rejects cookies or redirect target is wrong | Account/session may exist despite failed frontend arrival | Inspect actual host, policy, and destination |
| Browser loses the callback response | Account/session creation may already have happened | Offer a fresh flow without claiming nothing was created |

## 8. Suggested frontend flow

1. Start with a top-level navigation to `/api/auth/42`; do not construct callback profile JSON.
2. Let the provider return to the backend callback and let the browser follow the `303`.
3. On the destination page, use application cookie-based requests. Do not look for provider/app tokens in the URL or browser storage.
4. Account for backend error JSON when authorization or persistence fails; no frontend failure page is selected by this callback.
5. Retry deliberately through the start route, rather than replaying a previous callback code.

There is no active `/me` endpoint in this controller to fetch a profile after redirect. The commented protected test routes are unavailable. Both normal and 42 sessions use the same refresh/logout endpoints.

## 9. Integration scenarios to verify

These are proposed checks, **not executed tests**. Use a provider test application and controlled database; success creates accounts/sessions.

- First-time provider ID → linked `users`/`ft_users`, schema defaults, session row, both cookies, exact `303` destination.
- Returning provider ID → no duplicate account, new session, existing profile unchanged.
- Deleted local account → `403`, no newly issued cookies/session.
- Missing provider email/image → nullable mapping, default profile image, and no stored email.
- Same email as an existing normal account → no automatic merge or normal-account login.
- Lookup/create `P1001` or session-insert failure → `503`; create uniqueness failure → explicit `500`, not `409`.
- Create failure with email → failure notification attempted; mail outage preserves original response.
- Provider denial → `401`; invalid/reused code or profile failure → OAuth error handling; missing code → authorization redirect.
- Session failure after account creation → account remains and a later fresh authorization can log in.
- Actual callback host, browser cookie acceptance, hard-coded frontend destination, and subsequent cookie-based refresh/logout.

## 10. Implementation references

- [Callback route, cookies, and hard-coded redirect](../src/auth/auth.controller.ts)
- [Provider profile mapping and strategy configuration](../src/auth/strategy/fortytow.strategy.ts)
- [42 account flow, JWTs, and session creation](../src/auth/auth.service.ts)
- [Provider-ID lookup, nested creation, and error mapping](../src/users/user.service.ts)
- [Session insertion](../src/auth/SessionService/session.service.ts)
- [Caught creation-failure email errors](../src/mail/mail.service.ts)
- [Provider profile TypeScript shape](../src/dto/forytowuserdto.ts)
- [Request type](../src/common/types/auth-fortytow.type.ts)
- [Secrets/configuration access](../src/Secrets/secrets.service.ts)
- [Database schema](../prisma/schema.prisma)
- [Bootstrap](../src/main.ts)

Provider exchange, missing-code redirect, and error defaults were also checked in the locally installed `passport-42`, `passport-oauth2`, `passport`, and `@nestjs/passport` implementations.
