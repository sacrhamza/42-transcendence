let connection;

function openDatabase() {
    if (!connection) {
        connection = new Promise((resolve, reject) => {
            const request = indexedDB.open('suf-preview', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('state');
            request.onsuccess = () => {
                const database = request.result;
                database.onversionchange = () => { database.close(); connection = null; };
                resolve(database);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('Browser storage is blocked.'));
        }).catch((error) => { connection = null; throw error; });
    }
    return connection;
}

// Read and change the latest record in one transaction, including across tabs.
export async function updateBrowserData(key, initialValue, update) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction('state', update ? 'readwrite' : 'readonly');
        const store = transaction.objectStore('state');
        const request = store.get(key);
        let value;
        let failure;
        request.onsuccess = () => {
            try {
                const current = request.result === undefined ? initialValue : request.result;
                value = update ? update(current) : current;
                if (update) store.put(value, key);
            } catch (error) {
                failure = error;
                transaction.abort();
            }
        };
        transaction.oncomplete = () => resolve(value);
        transaction.onabort = () => reject(failure || transaction.error || new Error('Could not save browser data.'));
        transaction.onerror = () => { /* onabort handles failed requests. */ };
    });
}

// Persist the File itself; blob URLs are only valid for the current page.
export function restoreAttachmentUrls(value, urls = []) {
    if (Array.isArray(value)) return value.map((item) => restoreAttachmentUrls(item, urls));
    if (!value || typeof value !== 'object' || value instanceof Blob) return value;
    const restored = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreAttachmentUrls(item, urls)]));
    if (value.file instanceof Blob) {
        restored.url = URL.createObjectURL(value.file);
        urls.push(restored.url);
    }
    return restored;
}
