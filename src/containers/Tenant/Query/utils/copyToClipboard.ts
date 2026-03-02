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

    const blob = new Blob(parts, {type: 'text/plain'});

    try {
        const clipboardItem = new ClipboardItem({'text/plain': blob});
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch {
        // Fallback for older browsers without clipboard.write() support (Firefox < 127)
        try {
            const text = await blob.text();
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }
}
