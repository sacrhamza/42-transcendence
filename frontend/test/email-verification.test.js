import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from 'vite';
import { verifyEmailToken } from '../src/utils/emailVerification.js';

test('email browser navigation reaches the frontend before a single verification API request', async () => {
    let requests = 0;
    const backend = http.createServer((req, res) => {
        requests++;
        assert.equal(req.url, '/api/auth/verify-email?token=test-success');
        assert.equal(req.headers.accept, 'application/json');
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ msg: 'User registered successfully', userId: '42' }));
    });
    await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
    let vite;
    try {
        vite = await createServer({
            server: {
                host: '127.0.0.1', port: 0,
                proxy: { '/api': { target: `http://127.0.0.1:${backend.address().port}` } },
            },
        });
        await vite.listen();
        const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
        const click = await fetch(`${base}/api/auth/verify-email?token=test-success`, {
            headers: { Accept: 'text/html' }, redirect: 'manual',
        });
        assert.equal(click.status, 302);
        assert.equal(click.headers.get('location'), '/verify-email?token=test-success');
        assert.equal(requests, 0);
        const page = await fetch(`${base}${click.headers.get('location')}`);
        assert.match(await page.text(), /<div id="root"><\/div>/);
        assert.equal(requests, 0);

        const request = (url, options) => fetch(`${base}${url}`, options);
        const first = verifyEmailToken('test-success', request);
        const remount = verifyEmailToken('test-success', request);
        assert.equal(first, remount);
        assert.equal(await first, '/login?verification=success');
        assert.equal(requests, 1);
    } finally {
        await vite?.close();
        await new Promise(resolve => backend.close(resolve));
    }
});

test('expired token redirects to signup with an explanation', async () => {
    const request = async () => new Response(JSON.stringify({ message: 'Verification token is invalid or expired' }), { status: 400 });
    assert.equal(await verifyEmailToken('test-expired', request), '/signup?verification=expired');
});

test('missing token returns to signup without contacting the backend', async () => {
    const request = () => assert.fail('A missing token must not call the backend');
    assert.equal(await verifyEmailToken(null, request), '/signup?verification=expired');
});

test('server failures are not reported as expired tokens or successful registration', async () => {
    await assert.rejects(verifyEmailToken('test-server-failure', async () => new Response('', { status: 503 })), /could not confirm/);
});

test('an unexpected success response cannot claim that an account was created', async () => {
    await assert.rejects(verifyEmailToken('test-unexpected', async () => new Response('{}', { status: 200 })), /unexpected response/);
});
