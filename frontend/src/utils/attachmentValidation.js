import { validatePostFile } from './community.js';

const signatures = {
    png: (bytes) => startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10]),
    jpg: (bytes) => startsWith(bytes, [255, 216, 255]),
    jpeg: (bytes) => startsWith(bytes, [255, 216, 255]),
    gif: (bytes) => /^GIF8[79]a/.test(ascii(bytes, 0, 6)),
    webp: (bytes) => ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP',
    pdf: (bytes) => ascii(bytes, 0, 5) === '%PDF-',
    mp4: (bytes) => ascii(bytes, 4, 8) === 'ftyp',
    webm: (bytes) => startsWith(bytes, [26, 69, 223, 163]),
    doc: (bytes) => startsWith(bytes, [208, 207, 17, 224, 161, 177, 26, 225]),
    docx: (bytes) => startsWith(bytes, [80, 75, 3, 4]),
};
function startsWith(bytes, signature) {
    return signature.every((byte, index) => bytes[index] === byte);
}
function ascii(bytes, start, end) {
    return String.fromCharCode(...bytes.slice(start, end));
}

export async function validateAttachment(file, { extensions, maxBytes } = {}) {
    const info = validatePostFile(file);
    if (info.error) throw new Error(info.error);
    const extension = file.name.split('.').pop().toLowerCase();
    if (extensions && !extensions.includes(extension)) throw new Error('Choose one of the supported file types.');
    if (maxBytes && file.size > maxBytes) throw new Error(`Choose a file up to ${maxBytes / 1024 / 1024} MB.`);
    const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
    if (signatures[extension]) {
        if (!signatures[extension](bytes)) throw new Error('The file contents do not match its extension. Choose the original file without renaming its type.');
    } else {
        try {
            const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
            if (text.includes('\0')) throw new Error('Binary data');
        } catch {
            throw new Error('Choose a valid UTF-8 text or code file.');
        }
    }
    if (info.kind === 'image') {
        // Decoding also rejects files with a valid header but corrupt image data.
        const url = URL.createObjectURL(file);
        try {
            await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => image.naturalWidth && image.naturalHeight ? resolve() : reject(new Error('Empty image.'));
                image.onerror = () => reject(new Error('This image is damaged or cannot be opened.'));
                image.src = url;
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    }
    return info;
}
