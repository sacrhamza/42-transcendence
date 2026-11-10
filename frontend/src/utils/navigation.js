// Update the URL without reloading the frontend or clearing its preview state.
export function navigate(path, { replace = false } = {}) {
    const destination = new URL(path, window.location.origin);
    if (destination.pathname + destination.search === window.location.pathname + window.location.search) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', destination.pathname + destination.search);
    window.dispatchEvent(new PopStateEvent('popstate'));
}
