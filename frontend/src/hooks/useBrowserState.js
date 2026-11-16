import { useCallback, useEffect, useRef, useState } from 'react';
import { restoreAttachmentUrls, updateBrowserData } from '../utils/browserDatabase.js';

export default function useBrowserState(key, initialValue) {
    const [initial] = useState(() => typeof initialValue === 'function' ? initialValue() : initialValue);
    const [snapshot, setSnapshot] = useState({ value: initial, urls: [] });
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState('');
    const current = useRef(initial);
    const channel = useRef(null);
    const mounted = useRef(false);
    const temporary = useRef(false);

    const show = useCallback((value) => {
        if (!mounted.current) return;
        current.current = value;
        const urls = [];
        setSnapshot({ value: restoreAttachmentUrls(value, urls), urls });
    }, []);

    useEffect(() => () => snapshot.urls.forEach((url) => URL.revokeObjectURL(url)), [snapshot]);

    useEffect(() => {
        mounted.current = true;
        async function reload() {
            if (temporary.current) return;
            try {
                const value = await updateBrowserData(key, initial);
                if (!temporary.current) {
                    show(value);
                    if (mounted.current) setNotice('');
                }
            } catch {
                if (mounted.current) setNotice('Browser storage is unavailable. Changes are temporary and may be lost when you leave or refresh.');
            } finally {
                if (mounted.current) setReady(true);
            }
        }
        if (typeof BroadcastChannel !== 'undefined') {
            channel.current = new BroadcastChannel(`suf-preview-${key}`);
            channel.current.onmessage = reload;
        }
        // Also refresh a background tab when it becomes active again.
        window.addEventListener('focus', reload);
        reload();
        return () => {
            mounted.current = false;
            channel.current?.close();
            channel.current = null;
            window.removeEventListener('focus', reload);
        };
    }, [key, initial, show]);

    const update = useCallback(async (change) => {
        const apply = typeof change === 'function' ? change : () => change;
        try {
            if (temporary.current) throw new Error('Unsaved local changes');
            const value = await updateBrowserData(key, initial, apply);
            show(value);
            if (mounted.current) setNotice('');
            channel.current?.postMessage('updated');
            return true;
        } catch {
            temporary.current = true;
            show(apply(current.current));
            if (mounted.current) setNotice('Could not save browser data. This change is temporary; keep a copy before leaving or refreshing.');
            return false;
        }
    }, [key, initial, show]);

    return [snapshot.value, update, notice, ready];
}
