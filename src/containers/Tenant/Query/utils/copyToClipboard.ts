import type {KeyValueRow} from '../../../../types/api/query';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';

import {buildTsvBlobParts} from './getPreparedResult';

export async function copyResultToClipboard(resultData: KeyValueRow[] | undefined) {
    return copyBlobPartsToClipboard(buildTsvBlobParts(resultData));
}

export async function copyTextDataToClipboard(data: unknown) {
    const text = getStringifiedData(data);
    if (!text) {
        return false;
    }
    return copyBlobPartsToClipboard([text]);
}

async function copyBlobPartsToClipboard(parts: BlobPart[]) {
    if (!parts.length) {
        return false;
    }

    // Async Clipboard API requires a secure context (HTTPS or localhost).
    // YDB Embedded UI is often served over plain HTTP on internal hosts,
    // where `navigator.clipboard` is undefined, so we must guard the access
    // and fall back to the legacy `document.execCommand('copy')` path.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        // Prefer ClipboardItem with a Blob: this avoids materializing the
        // full TSV as a single JS string, which can hit the V8 max string
        // length limit for very large query results.
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
            try {
                const blob = new Blob(parts, {type: 'text/plain'});
                const clipboardItem = new ClipboardItem({'text/plain': blob});
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } catch {
                // Fall through to writeText / execCommand fallbacks below.
            }
        }

        if (navigator.clipboard.writeText) {
            try {
                // Fallback for older browsers without clipboard.write() support (Firefox < 127)
                await navigator.clipboard.writeText(blobPartsToString(parts));
                return true;
            } catch {
                // Fall through to execCommand fallback below.
            }
        }
    }

    return copyTextWithExecCommand(blobPartsToString(parts));
}

function blobPartsToString(parts: BlobPart[]): string {
    const stringParts: string[] = [];
    for (const part of parts) {
        stringParts.push(typeof part === 'string' ? part : String(part));
    }
    return stringParts.join('');
}

function copyTextWithExecCommand(text: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Avoid scrolling to the bottom and keep the textarea off-screen.
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.tabIndex = -1;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);

    try {
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}
