import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { updateBrowserData, restoreAttachmentUrls } from '../src/utils/browserDatabase.js';
import { validateAttachment } from '../src/utils/attachmentValidation.js';
import { initialConversations, sendDirectMessage } from '../src/data/messagesData.js';
import { createId } from '../src/utils/createId.js';

test('simultaneous message updates preserve both messages', async () => {
    await Promise.all(['First tab', 'Second tab'].map((text) => updateBrowserData(
        'concurrent-messages', initialConversations(),
        (current) => sendDirectMessage(current, 'yassine', text, true),
    )));
    const stored = await updateBrowserData('concurrent-messages', {});
    assert.deepEqual(stored.yassine.messages.slice(-2).map((message) => message.text), ['First tab', 'Second tab']);
});

test('posts, projects and room attachments survive a fresh read with working URLs', async () => {
    for (const key of ['posts', 'projects', 'rooms']) {
        const file = new Blob(['persistent attachment'], { type: 'text/plain' });
        await updateBrowserData(key, [], () => [{ id: 'local-item', attachment: { name: 'brief.txt', file, url: 'blob:expired' } }]);
        const saved = await updateBrowserData(key, []);
        const urls = [];
        const restored = restoreAttachmentUrls(saved, urls);
        assert.notEqual(restored[0].attachment.url, 'blob:expired');
        assert.equal(await (await fetch(restored[0].attachment.url)).text(), 'persistent attachment');
        urls.forEach((url) => URL.revokeObjectURL(url));
    }
});

test('an aborted save leaves the previous record intact', async () => {
    await updateBrowserData('failed-save', [], () => ['saved']);
    await assert.rejects(updateBrowserData('failed-save', [], () => ({ invalid: () => {} })));
    assert.deepEqual(await updateBrowserData('failed-save', []), ['saved']);
});

test('renamed image, PDF, video and Word files are rejected', async () => {
    for (const name of ['fake.png', 'fake.jpg', 'fake.gif', 'fake.webp', 'fake.pdf', 'fake.mp4', 'fake.webm', 'fake.doc', 'fake.docx']) {
        await assert.rejects(validateAttachment(new File(['plain text'], name)), /contents do not match/);
    }
});

test('empty, oversized, unsupported and binary text attachments are rejected', async () => {
    await assert.rejects(validateAttachment(new File([], 'empty.txt')), /Empty files/);
    await assert.rejects(validateAttachment(new File(['hello'], 'brief.txt'), { maxBytes: 4 }), /up to/);
    await assert.rejects(validateAttachment(new File(['hello'], 'script.exe')), /Use an image/);
    await assert.rejects(validateAttachment(new File(['hello'], 'brief.txt'), { extensions: ['pdf'] }), /supported file types/);
    await assert.rejects(validateAttachment(new File([new Uint8Array([0, 255])], 'binary.txt')), /UTF-8/);
});

test('valid PDFs, UTF-8 documents and header files are accepted', async () => {
    assert.equal((await validateAttachment(new File(['%PDF-1.7\nexample'], 'brief.pdf'))).mime, 'application/pdf');
    for (const name of ['brief.txt', 'README.md', 'main.c', 'main.h', 'main.hpp', 'app.js']) {
        assert.equal((await validateAttachment(new File(['Hello, مرحبا'], name))).kind, 'document');
    }
});

test('image decode failure is rejected even when the signature is valid', async () => {
    const previous = globalThis.Image;
    globalThis.Image = class { set src(value) { queueMicrotask(() => this.onerror()); } };
    try {
        await assert.rejects(validateAttachment(new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'broken.png')), /damaged/);
    } finally {
        globalThis.Image = previous;
    }
});

test('IDs remain unique when multiple items are created at the same time', () => {
    const ids = Array.from({ length: 1000 }, createId);
    assert.equal(new Set(ids).size, ids.length);
});
