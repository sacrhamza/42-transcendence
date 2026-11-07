export function createId() {
    // getRandomValues also works on HTTP LAN previews, unlike randomUUID.
    return Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, '0')).join('');
}
