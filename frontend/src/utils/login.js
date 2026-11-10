export async function login({ email, password }, request = fetch) {
    const response = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null);
    if (response.status === 401) throw new Error('Invalid email or password.');
    if (response.status === 429) throw new Error('Too many login attempts. Please try again later.');
    if (!response.ok) {
        const message = data?.message;
        throw new Error(response.status === 400 && message
            ? Array.isArray(message) ? message.join(' ') : String(message)
            : 'Unable to log in right now. Please try again later.');
    }
    if (typeof data?.accessToken !== 'string' || !data.accessToken.trim()
        || typeof data.refreshToken !== 'string' || !data.refreshToken.trim()
        || data.tokenType !== 'Bearer') {
        throw new Error('The login service returned an invalid session. Please try again later.');
    }
    return data;
}
