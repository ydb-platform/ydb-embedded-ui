import {ReadableStream as WebReadableStream} from 'stream/web';
import {TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder} from 'util';

import type {MultipartPart} from '@mjackson/multipart-parser';

import {readPartText} from '../streamingPartReader';

// jsdom does not provide Web Streams / Encoding APIs; polyfill for this test file.
/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof globalThis.ReadableStream === 'undefined') {
    (globalThis as any).ReadableStream = WebReadableStream;
}
if (typeof globalThis.TextEncoder === 'undefined') {
    (globalThis as any).TextEncoder = NodeTextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
    (globalThis as any).TextDecoder = NodeTextDecoder;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function createFakePart(bodyChunks: Uint8Array[], contentLength: number | null): MultipartPart {
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of bodyChunks) {
                controller.enqueue(chunk);
            }
            controller.close();
        },
    });

    return {
        headers: {contentLength},
        body,
        text: () => {
            const reader = body.getReader();
            const chunks: Uint8Array[] = [];
            const pump = (): Promise<string> =>
                reader.read().then(({done, value}) => {
                    if (done) {
                        const total = chunks.reduce((s, c) => s + c.byteLength, 0);
                        const merged = new Uint8Array(total);
                        let off = 0;
                        for (const c of chunks) {
                            merged.set(c, off);
                            off += c.byteLength;
                        }
                        return new TextDecoder().decode(merged);
                    }
                    chunks.push(value);
                    return pump();
                });
            return pump();
        },
    } as unknown as MultipartPart;
}

function toBytes(str: string): Uint8Array {
    return Buffer.from(str);
}

function splitBytes(data: Uint8Array, ...splitPoints: number[]): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    let prev = 0;
    for (const point of splitPoints) {
        chunks.push(data.subarray(prev, point));
        prev = point;
    }
    chunks.push(data.subarray(prev));
    return chunks;
}

describe('readPartText', () => {
    test('reads body delivered as a single chunk', async () => {
        const json = '{"event":"SessionCreated"}';
        const bytes = toBytes(json);
        const part = createFakePart([bytes], bytes.byteLength);

        const result = await readPartText(part);
        expect(result).toBe(json);
    });

    test('accumulates body split across multiple small chunks', async () => {
        const json = '{"meta":{"event":"SessionCreated","node_id":1,"query_id":"q1"}}';
        const bytes = toBytes(json);
        const chunks = splitBytes(bytes, 5, 20, 40);

        expect(chunks.length).toBe(4);
        expect(chunks.reduce((sum, c) => sum + c.byteLength, 0)).toBe(bytes.byteLength);

        const part = createFakePart(chunks, bytes.byteLength);
        const result = await readPartText(part);
        expect(result).toBe(json);
    });

    test('accumulates body delivered one byte at a time', async () => {
        const json = '{"x":1}';
        const bytes = toBytes(json);
        const chunks = Array.from(bytes).map((b) => new Uint8Array([b]));

        const part = createFakePart(chunks, bytes.byteLength);
        const result = await readPartText(part);
        expect(result).toBe(json);
    });

    test('falls back to part.text() when Content-Length is absent', async () => {
        const json = '{"fallback":true}';
        const bytes = toBytes(json);
        const part = createFakePart([bytes], null);

        const result = await readPartText(part);
        expect(result).toBe(json);
    });

    test('handles async delivery with delays between chunks', async () => {
        const json = '{"delayed":"chunks"}';
        const bytes = toBytes(json);
        const mid = Math.floor(bytes.byteLength / 2);

        const body = new ReadableStream<Uint8Array>({
            async start(controller) {
                controller.enqueue(bytes.subarray(0, mid));
                await new Promise((r) => setTimeout(r, 50));
                controller.enqueue(bytes.subarray(mid));
                controller.close();
            },
        });

        const part = {
            headers: {contentLength: bytes.byteLength},
            body,
            text: () => Promise.resolve(json),
        } as unknown as MultipartPart;

        const result = await readPartText(part);
        expect(result).toBe(json);
    });
});
