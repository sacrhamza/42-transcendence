import test from 'node:test';
import assert from 'node:assert/strict';
import { login } from '../src/utils/login.js';

const credentials = { email: 'test@example.com', password: 'WrongPassword9!' };

test('wrong credentials reject login and never trigger entry to home', async () => {
    let entered = false;
    const request = async (url, options) => {
        assert.equal(url, '/api/auth/login');
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.body), credentials);
        return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    };
    await assert.rejects(login(credentials, request).then(() => { entered = true; }), /Invalid email or password/);
    assert.equal(entered, false);
});

test('successful login returns the backend session', async () => {
    const session = { accessToken: 'test-access-token', refreshToken: 'test-refresh-token', tokenType: 'Bearer' };
    const result = await login(credentials, async () => new Response(JSON.stringify(session), { status: 200 }));
    assert.deepEqual(result, session);
});

test('an HTTP success without session tokens cannot grant access', async () => {
    for (const data of [{}, { accessToken: 'token' }, { accessToken: '', refreshToken: 'token', tokenType: 'Bearer' }]) {
        await assert.rejects(login(credentials, async () => new Response(JSON.stringify(data))), /invalid session/);
    }
    await assert.rejects(login(credentials, async () => new Response('<html>fallback page</html>')), /invalid session/);
});

test('backend outages and rate limiting do not authenticate the user', async () => {
    await assert.rejects(login(credentials, async () => new Response('', { status: 503 })), /Unable to log in/);
    await assert.rejects(login(credentials, async () => new Response('', { status: 429 })), /Too many login attempts/);
    await assert.rejects(login(credentials, async () => { throw new TypeError('Failed to fetch'); }), /Failed to fetch/);
});

test('request validation errors stay on login with a useful message', async () => {
    await assert.rejects(login(credentials, async () => new Response(JSON.stringify({ message: ['email must be an email'] }), { status: 400 })), /email must be an email/);
});
