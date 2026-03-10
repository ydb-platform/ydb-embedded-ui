import type {MultipartPart} from '@mjackson/multipart-parser';

const MAX_PART_SIZE = 64 * 1024 * 1024;
let decoder: TextDecoder | undefined;

export async function readPartText(part: MultipartPart): Promise<string> {
    const contentLength = part.headers.contentLength;
    if (contentLength === null || contentLength <= 0 || contentLength > MAX_PART_SIZE) {
        return part.text();
    }

    const reader = part.body.getReader();
    try {
        const buffer = new Uint8Array(contentLength);
        let offset = 0;

        while (offset < contentLength) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            const remaining = contentLength - offset;
            const slice = value.byteLength <= remaining ? value : value.subarray(0, remaining);
            buffer.set(slice, offset);
            offset += slice.byteLength;
        }

        decoder ??= new TextDecoder();
        return decoder.decode(buffer.subarray(0, offset));
    } finally {
        reader.releaseLock();
    }
}
