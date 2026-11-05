// Update the URL without reloading the frontend or clearing its preview state.
export function navigate(path) {
    const destination = new URL(path, window.location.origin);
    if (destination.pathname + destination.search === window.location.pathname + window.location.search) return;
    window.history.pushState(null, '', destination.pathname + destination.search);
    window.dispatchEvent(new PopStateEvent('popstate'));
}
