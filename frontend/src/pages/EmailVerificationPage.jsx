import React, { useEffect, useState } from 'react';
import { navigate } from '../utils/navigation.js';
import { verifyEmailToken } from '../utils/emailVerification.js';

export default function EmailVerificationPage() {
    const [token] = useState(() => new URLSearchParams(window.location.search).get('token'));
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        // Remove the single-use token from the address bar and browser history.
        window.history.replaceState(null, '', '/verify-email');
        verifyEmailToken(token).then((destination) => {
            if (active) navigate(destination, { replace: true });
        }).catch((reason) => {
            if (active) setError(reason instanceof TypeError
                ? 'Unable to reach the verification service. Check your connection before opening the email link again.'
                : reason.message);
        });
        return () => { active = false; };
    }, [token]);

    return (
        <main className="shell">
            <section className="auth">
                <div className="form-wrap">
                    <h2>{error ? 'We could not verify your email.' : 'Verifying your email…'}</h2>
                    <p className="notice" role={error ? 'alert' : 'status'}>
                        {error || 'Please wait while we complete your SUF registration.'}
                    </p>
                    {error && <a className="text-button" href="/login">Go to login</a>}
                </div>
            </section>
        </main>
    );
}
