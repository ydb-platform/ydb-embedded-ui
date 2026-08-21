import {MAX_QUERY_HEIGHT} from '../../utils/constants';

const MAX_QUERY_PREVIEW_LENGTH = 2000;

export function getQueryPreviewText(queryText: string): string {
    let previewEnd = Math.min(queryText.length, MAX_QUERY_PREVIEW_LENGTH);
    let lineBreaks = 0;

    for (let index = 0; index < previewEnd; index++) {
        if (queryText.charCodeAt(index) === 10) {
            lineBreaks++;
            if (lineBreaks === MAX_QUERY_HEIGHT) {
                previewEnd = index;
                break;
            }
        }
    }

    return queryText.slice(0, previewEnd);
}
