# Start 42 Authentication API — Frontend Integration Guide

This document describes the current entry point for Continue with 42 in this working tree. It starts the Passport OAuth flow by redirecting the browser to 42. It does not itself create an application account or session. The behavior is based on application code and the locally installed Passport dependencies, not executed provider integration tests.

See the [42 callback](api-auth-42-callback.md) guide for profile mapping, account creation/login, cookies, and the final frontend redirect. See the [API index](README.md) for the other routes.

## 1. Endpoint and response contract

| Purpose | Method | Endpoint | Normal response | Response body |
| --- | --- | --- | --- | --- |
| Start 42 OAuth authorization | `GET` | `/api/auth/42` | `302 Found` to the 42 authorization URL | No application JSON contract |

- Public route; no application access or refresh cookie is required.
- The route uses `@UseGuards(AuthGuard('42'))`.
- Passport handles the redirect before the empty `start42Auth()` method needs to do anything.
- A normal start request does not set application authentication cookies or write an account/session row.

## 2. Request and frontend invocation

```http
GET /api/auth/42
```

Use a browser navigation so the user can interact with the provider:

```html
<a href="/api/auth/42">Continue with 42</a>
```

Or:

```js
window.location.assign('/api/auth/42');
```

These examples assume the frontend origin routes `/api` to Nest. For a separate backend origin, navigate to its configured full URL. A `fetch()` call follows redirects as a request rather than navigating the page into the provider's login flow, and cross-origin response restrictions can apply.

There is no request body, DTO, or custom `returnTo`/`redirect` parameter. Passing a desired destination does not override the application's hard-coded final redirect. The provider manages its own login/consent UI.

## 3. Strategy configuration and redirect

`AuthModule` registers `fortytowstrategy` under the Passport name `'42'`. Its constructor reads these values through `SecretsService.getSecret()`, which uses `ConfigService.getOrThrow()`:

| Configuration | Purpose |
| --- | --- |
| `INTRA_UID` | OAuth client ID sent as `client_id` |
| `INTRA_SECRET` | Client secret used by the backend during code exchange; not sent to frontend JavaScript |
| `INTRA_CALLBACK` | Callback URL sent as `redirect_uri`; must route to the callback endpoint and match the provider application's configuration |

The strategy requests `scope: ['public']`. It does not override the installed `passport-42` defaults:

| Operation | Provider URL |
| --- | --- |
| Authorization | `https://api.intra.42.fr/oauth/authorize` |
| Code exchange | `https://api.intra.42.fr/oauth/token` |
| Profile retrieval | `https://api.intra.42.fr/v2/me` |

For an ordinary request without callback parameters, the processing is:

1. Nest runs the Passport `'42'` guard.
2. Passport selects the configured callback URL and public scope.
3. It builds an authorization URL with `response_type=code`, `client_id`, `redirect_uri`, and `scope=public`.
4. It returns a `302` with that URL in `Location`.
5. The browser opens the provider's page. After authorization, the provider returns the browser to `INTRA_CALLBACK` with an authorization code.

Illustrative response; actual values come from configuration:

```http
HTTP/1.1 302 Found
Location: https://api.intra.42.fr/oauth/authorize?response_type=code&redirect_uri=<encoded-INTRA_CALLBACK>&scope=public&client_id=<INTRA_UID>
```

Query ordering is not a contract. Missing required configuration can fail application startup because the strategy is instantiated during module initialization; it is not a normal JSON validation error from this route.

## 4. Current OAuth state and session behavior

The application's strategy does not enable OAuth `state`, a state store, or PKCE. The installed `passport-oauth2` implementation therefore uses its null state store, which does not persist/verify a per-browser nonce. The frontend should not assume state correlation or PKCE protection exists in this implementation.

The Nest Passport guard defaults to `session: false`. There is no Express/Passport login-session setup in the current bootstrap; application login later uses JWT cookies and a PostgreSQL refresh-session row.

The backend's 42 access/refresh tokens are provider credentials used during the callback. They are distinct from the application's `access_token` and `refresh_token` cookies.

## 5. Errors and unusual query parameters

The application defines no custom error handler, failure redirect, or JSON success body for this entry point. Errors raised by the Passport guard are handled by Nest.

| Situation | Current behavior |
| --- | --- |
| Ordinary request | `302` to provider authorization |
| Required strategy configuration missing | Can prevent application startup |
| Strategy/runtime error while handling the request | Normally `500` with `Internal server error` |
| Provider rejects client/callback configuration after navigation | Provider page/response; not a custom error JSON returned by this initial redirect |
| Query contains `error=access_denied` | Shared OAuth strategy reports authentication failure; Nest guard returns `401 Unauthorized` |
| Query contains an authorization `code` | Shared strategy takes its callback branch rather than the ordinary redirect branch |

Both `/42` and `/42/callback` use the same guard. Send a clean `/42` URL to start authentication. If a caller supplies a valid callback code to `/42`, the guard can exchange it and populate `req.user`, but `start42Auth()` does not call `continueWith42()` or set application cookies. Do not use the start route as the configured callback URL.

Unknown request query properties are not validated by a DTO here. Do not treat arbitrary query parameters as supported frontend controls. For provider callback error details, see the [callback error table](api-auth-42-callback.md#6-error-responses).

## 6. Edge cases and actual guarantees

| Situation | Current behavior | Frontend action |
| --- | --- | --- |
| User already has a 42 application account | Start route still redirects; callback looks up the provider ID | Use the same Continue with 42 action |
| User already has normal login cookies | Start route does not enforce or link that identity | Do not describe this as connecting 42 to the existing normal account |
| User cancels authorization | Callback handles provider denial; no custom failure redirect is configured | Account for a backend error page/JSON rather than assuming a frontend error route |
| User clicks several times | Multiple independent provider navigations can start | Disable repeated action after navigation begins |
| User wants to return to a particular frontend page | No return destination is stored by the entry point | Current successful callback always targets `http://localhost:3001/feed` |
| Frontend proxy works but `INTRA_CALLBACK` is unreachable | Initial redirect can work while callback fails | Verify both public entry and callback URLs |
| Frontend tries to read JWTs after clicking | Start route provides no application tokens | Let callback establish cookies |

## 7. Suggested frontend flow

1. Provide a Continue with 42 link/button that navigates to the API entry point.
2. Let the browser and provider perform login/authorization.
3. Let the configured callback perform application account lookup/creation and cookie issuance.
4. Expect the final `303` redirect documented in the callback guide; there is no JSON token handoff to the frontend.
5. Verify deployment routing, callback reachability, and final destination before relying on this flow outside the local environment.

Do not send normal registration fields, an email/password, a 42 user ID from the browser, or `INTRA_SECRET` to this route. The callback obtains profile identity through the provider exchange.

## 8. Integration scenarios to verify

These are proposed checks, **not executed tests**:

- Clean entry URL → `302` with configured client ID, callback, public scope, and code response type.
- Initial request → no application account/session insertion or application authentication cookies.
- Browser follows provider authorization and returns to the configured callback endpoint.
- Provider client/callback mismatch → observe provider failure rather than expecting application DTO errors.
- Missing configuration → verify startup failure and deployment configuration.
- Inspect that no state nonce/PKCE behavior is supplied by the current strategy.
- Cancelled authorization → callback error behavior; no automatic frontend failure redirect.
- Frontend navigation through the real API proxy rather than `fetch()`.

## 9. Implementation references

- [Start route and Passport guard](../src/auth/auth.controller.ts)
- [Strategy options and profile mapping](../src/auth/strategy/fortytow.strategy.ts)
- [Strategy registration](../src/auth/auth.module.ts)
- [Required configuration access](../src/Secrets/secrets.service.ts)
- [Bootstrap](../src/main.ts)
- [Frontend development proxy](../../../frontend/vite.config.js)

Provider endpoint defaults, redirect status, error handling, and null-state-store behavior were also checked in the locally installed `passport-42`, `passport-oauth2`, `passport`, and `@nestjs/passport` implementations. These dependency defaults should be rechecked when dependencies change.
