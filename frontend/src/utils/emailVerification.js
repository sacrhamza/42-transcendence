let currentVerification;

// Share the request across React effect remounts: verification tokens are single-use.
export function verifyEmailToken(token, request = fetch) {
    if (!token) return Promise.resolve('/signup?verification=expired');
    if (currentVerification?.token === token && currentVerification.request === request) {
        return currentVerification.promise;
    }
    const promise = (async () => {
        const response = await request(`/api/auth/verify-email?${new URLSearchParams({ token })}`, {
            headers: { Accept: 'application/json' },
        });
        if (response.status === 400) return '/signup?verification=expired';
        if (!response.ok) {
            throw new Error('We could not confirm your registration. If you already verified your email, try logging in. Otherwise, contact support before trying again.');
        }
        const data = await response.json();
        if (!data?.userId) throw new Error('The verification service returned an unexpected response.');
        return '/login?verification=success';
    })();
    currentVerification = { token, request, promise };
    return promise;
}
