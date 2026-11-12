import React, { useState } from 'react';
import { navigate } from '../utils/navigation.js';
import { login } from '../utils/login.js';

export default function LoginPage({ onEnter, theme, onToggleTheme, mode = 'login', initialNotice = '' }) {
    const [visible, setVisible] = useState(false);
    const [notice, setNotice] = useState(initialNotice);
    const [passwordError, setPasswordError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const signup = mode === 'signup';

    function continueWith42() {
        const loginUrl = import.meta.env.VITE_42_LOGIN_URL;

        if (!loginUrl) {
            setNotice(
                '42 sign-in is not available yet. Please try again later.',
            );
            return;
        }

        let destination;
        try {
            destination = new URL(loginUrl, window.location.origin);
        } catch {
            setNotice('42 sign-in is unavailable. Please try again later.');
            return;
        }

        if (!['http:', 'https:'].includes(destination.protocol)) {
            setNotice('42 sign-in is unavailable. Please try again later.');
            return;
        }

        window.location.assign(destination.href);
    }

    function changeMode(nextMode) {
        navigate('/' + nextMode);
        setNotice('');
        setVisible(false);
    }

    function validatePasswords(form) {
        if (!signup) return true;
        const password = form.elements.namedItem('password');
        const confirm = form.elements.namedItem('confirm');
        const message = confirm.value && password.value !== confirm.value
            ? 'Your passwords do not match.'
            : '';
        confirm.setCustomValidity(message);
        setPasswordError(message);
        return !message;
    }

    async function submit(event) {
        event.preventDefault();
        if (submitting) return;
        if (!validatePasswords(event.currentTarget)) {
            event.currentTarget.reportValidity();
            return;
        }

        const form = event.currentTarget;
        const fields = new FormData(form);
        setSubmitting(true);
        setNotice('');
        try {
            if (!signup) {
                const session = await login({
                    email: fields.get('email'),
                    password: fields.get('password'),
                });
                form.reset();
                onEnter(session);
                return;
            }
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: fields.get('username'),
                    email: fields.get('email'),
                    password: fields.get('password'),
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const message = data?.message;
                throw new Error(
                    Array.isArray(message) ? message.join(' ') :
                        typeof message === 'string' ? message :
                            'Registration failed. Please try again later.',
                );
            }
            form.reset();
            setNotice('Check your email for a verification link to complete your registration.');
        } catch (error) {
            setNotice(error instanceof TypeError
                ? `Unable to reach the ${signup ? 'registration' : 'login'} service. Please try again later.`
                : error.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="shell">
            <button
                className="theme-toggle login-theme-toggle"
                type="button"
                onClick={onToggleTheme}
                aria-label={
                    theme === 'dark'
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                }
                title={
                    theme === 'dark'
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                }
            >
                {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>

            <section
                className="story"
                aria-label="About SUF"
            >
                <a
                    className="brand"
                    href="/login"
                    aria-label="Stack Under Flow"
                >
                    <img
                        src="/logo.png"
                        style={theme === 'light' ? {
                            filter: 'invert(1) hue-rotate(180deg) contrast(1.35)',
                            mixBlendMode: 'multiply',
                        } : undefined}
                        alt="SUF — Stack Under Flow"
                    />
                </a>

                <div className="story-body">
                    <div className="eyebrow">
                        <span /> A COMMUNITY BUILT BY PEERS
                    </div>
                    <h1>
                        Great code starts
                        <br />
                        with a <em>conversation.</em>
                    </h1>
                    <p>
                        Share what you’re building. Find your peers.
                        <br />
                        Turn the next roadblock into a breakthrough.
                    </p>

                    <div className="terminal">
                        <div className="terminal-bar">
                            <i />
                            <i />
                            <i />
                            <span>the flow / discussion room</span>
                        </div>
                        <div className="terminal-content">
                            <p>
                                <b>user1@SUF</b> <span>~</span> How do I fix
                                this pipe?
                            </p>
                            <p>
                                <b className="purple">user2@SUF</b>{' '}
                                <span>~</span> Let’s work through it together.
                            </p>
                            <p>
                                <b>user3@SUF</b> <span>~</span>{' '}
                                <span className="cursor">▍</span>
                            </p>
                        </div>
                    </div>

                    <div className="features">
                        <span>01 / Share projects</span>
                        <span>02 / Solve together</span>
                        <span>03 / Keep learning</span>
                    </div>
                </div>

                <footer>
                    STACK UNDER FLOW <span>Built for curious minds.</span>
                </footer>
            </section>

            <section className="auth">
                <div className="form-wrap">
                    <div className="small-label">YOUR NEXT CHAPTER</div>
                    <h2>{signup ? 'Find your people.' : 'Welcome back.'}</h2>
                    <p className="intro">
                        {signup
                            ? 'Create an account and join the conversation.'
                            : 'Your projects and peers are waiting for you.'}
                    </p>

                    <div
                        className="switch"
                        aria-label="Account options"
                    >
                        <button
                            type="button"
                            aria-pressed={!signup}
                            className={!signup ? 'selected' : ''}
                            onClick={() => changeMode('login')}
                        >
                            Log in
                        </button>
                        <button
                            type="button"
                            aria-pressed={signup}
                            className={signup ? 'selected' : ''}
                            onClick={() => changeMode('signup')}
                        >
                            Sign up
                        </button>
                    </div>

                    <form
                        key={mode}
                        onSubmit={submit}
                        onInput={(event) => {
                            if (['password', 'confirm'].includes(event.target.name)) {
                                validatePasswords(event.currentTarget);
                            }
                        }}
                    >
                        {signup && (
                            <label>
                                Username
                                <input
                                    name="username"
                                    autoComplete="username"
                                    placeholder="Choose your username"
                                    minLength={2}
                                    maxLength={50}
                                    pattern="[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*"
                                    title="Use 2–50 letters and numbers, with at least one letter. Symbols and spaces are not allowed."
                                    aria-describedby="username-requirements"
                                    required
                                />
                                <span id="username-requirements" className="notice field-hint">
                                    Use 2–50 letters and numbers, including at least one letter. No symbols or spaces.
                                </span>
                            </label>
                        )}

                        <label>
                            Email address
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                maxLength={signup ? 50 : undefined}
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <label>
                            Password
                            <div className="password">
                                <input
                                    name="password"
                                    type={visible ? 'text' : 'password'}
                                    autoComplete={
                                        signup
                                            ? 'new-password'
                                            : 'current-password'
                                    }
                                    placeholder={
                                        signup
                                            ? '8–50 characters'
                                            : 'Enter your password'
                                    }
                                    minLength={signup ? 8 : undefined}
                                    maxLength={signup ? 50 : undefined}
                                    aria-describedby={signup ? 'password-requirements' : undefined}
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label={
                                        visible
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    onClick={() => setVisible(!visible)}
                                >
                                    {visible ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </label>

                        {signup && (
                            <p id="password-requirements" className="notice">
                                Use 8–50 characters with uppercase and lowercase letters,
                                a number, and a symbol. No whitespace or your username.
                            </p>
                        )}

                        {signup && (
                            <label>
                                Confirm password
                                <input
                                    name="confirm"
                                    aria-invalid={passwordError ? true : undefined}
                                    aria-describedby={passwordError ? 'confirm-password-error' : undefined}
                                    type={visible ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Enter your password again"
                                    required
                                />
                                {passwordError && (
                                    <span id="confirm-password-error" className="notice" role="alert">
                                        {passwordError}
                                    </span>
                                )}
                            </label>
                        )}

                        {!signup && (
                            <a className="text-button" href="/forgot-password">
                                Forgot password?
                            </a>
                        )}
                        <button
                            className="primary"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? signup ? 'Creating account…' : 'Logging in…' : signup ? 'Create account' : 'Log in'}{' '}
                            <span aria-hidden="true">↗</span>
                        </button>
                    </form>

                    <div className="auth-divider">or</div>
                    <button
                        className="intra-button"
                        type="button"
                        onClick={continueWith42}
                    >
                        <strong aria-hidden="true">42</strong>
                        Continue with 42
                    </button>

                    {notice && (
                        <p
                            className="notice"
                            role="status"
                        >
                            {notice}
                        </p>
                    )}

                    <p className="prototype">
                        {signup ? 'Verify your email to complete registration.' : 'Log in with your verified SUF account.'}
                    </p>
                </div>
            </section>
        </main>
    );
}

