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

    // Lazily materialise the joined string only when a fallback path needs
    // it, and cache it so we don't allocate the (potentially very large)
    // TSV string twice if both async methods fail.
    let cachedText: string | undefined;
    const getText = (): string => {
        if (cachedText === undefined) {
            cachedText = blobPartsToString(parts);
        }
        return cachedText;
    };

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
                await navigator.clipboard.writeText(getText());
                return true;
            } catch {
                // Fall through to execCommand fallback below.
            }
        }
    }

    // Final fallback: hidden-textarea + document.execCommand('copy').
    // Materializing the joined string can throw `RangeError: Invalid string
    // length` for huge result sets — the same scenario that motivated the
    // chunked BlobPart path — so guard the whole step and resolve to false
    // instead of rejecting.
    try {
        return copyTextWithExecCommand(getText());
    } catch {
        return false;
    }
}

function blobPartsToString(parts: BlobPart[]): string {
    const stringParts: string[] = [];
    for (const part of parts) {
        if (typeof part === 'string') {
            stringParts.push(part);
        } else if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
            stringParts.push(new TextDecoder().decode(part));
        } else {
            // Blob: callers in this module currently only pass strings, so
            // this branch exists for type-completeness; Blob contents cannot
            // be read synchronously, so fall back to the type tag.
            stringParts.push(String(part));
        }
    }
    return stringParts.join('');
}

function copyTextWithExecCommand(text: string): boolean {
    if (typeof document === 'undefined' || !document.body) {
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

    try {
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        if (textarea.parentNode) {
            textarea.parentNode.removeChild(textarea);
        }
    }
}
