import type {KeyValueRow} from '../../../../types/api/query';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';

import {buildTsvBlobParts} from './getPreparedResult';

/**
 * Copies data to clipboard using Blob-based approach.
 * This avoids V8's max string length limit (~268 MB) by building
 * BlobPart[] without creating a single giant string.
 *
 * Primary: navigator.clipboard.write() with ClipboardItem (Blob-based)
 * Fallback: navigator.clipboard.writeText() for older browsers (Firefox < 127)
 */
export async function copyResultToClipboard(resultData: KeyValueRow[] | undefined) {
    const parts = buildTsvBlobParts(resultData);
    if (!parts.length) {
        return false;
    }

    return copyBlobPartsToClipboard(parts);
}

export async function copyTextDataToClipboard(data: unknown) {
    const text = getStringifiedData(data);
    if (!text) {
        return false;
    }

    return copyBlobPartsToClipboard([text]);
}

async function copyBlobPartsToClipboard(parts: BlobPart[]) {
    const blob = new Blob(parts, {type: 'text/plain'});

    try {
        const clipboardItem = new ClipboardItem({'text/plain': blob});
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch {
        // Fallback for browsers that don't support clipboard.write (Firefox < 127)
        // This path may still throw RangeError for very large data
        try {
            const text = await blob.text();
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }
}
