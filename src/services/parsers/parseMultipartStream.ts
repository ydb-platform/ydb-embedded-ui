import type {StreamingChunk} from '../../types/store/streaming';

const CRLF_BYTES = new Uint8Array([13, 10]); // \r\n
const HEADER_VALUE_DELIMITER_BYTES = new TextEncoder().encode(': ');

function arrayIndexOf(haystack: Uint8Array, needle: Uint8Array, start = 0): number {
    for (let i = start; i <= haystack.length - needle.length; i++) {
        let found = true;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i;
        }
    }
    return -1;
}

function arrayStartsWith(array: Uint8Array, prefix: Uint8Array, start = 0): boolean {
    if (start + prefix.length > array.length) {
        return false;
    }
    for (let i = 0; i < prefix.length; i++) {
        if (array[start + i] !== prefix[i]) {
            return false;
        }
    }
    return true;
}

function getContentHeadersData(data: Uint8Array, startPos: number): [number, number] {
    let contentLength = 0;
    let pos = startPos;
    const decoder = new TextDecoder();

    while (pos < data.length) {
        if (arrayStartsWith(data, CRLF_BYTES, pos)) {
            return [contentLength, pos + CRLF_BYTES.length];
        }

        const nextCRLF = arrayIndexOf(data, CRLF_BYTES, pos);
        if (nextCRLF === -1) {
            return [contentLength, startPos];
        }

        const line = data.slice(pos, nextCRLF);
        const colonIndex = arrayIndexOf(line, HEADER_VALUE_DELIMITER_BYTES);

        if (colonIndex !== -1) {
            const header = decoder.decode(line.slice(0, colonIndex)).toLowerCase();
            const value = decoder.decode(
                line.slice(colonIndex + HEADER_VALUE_DELIMITER_BYTES.length),
            );

            if (header === 'content-length') {
                const length = parseInt(value, 10);
                if (!isNaN(length)) {
                    contentLength = length;
                }
            }
        }

        pos = nextCRLF + CRLF_BYTES.length;
    }

    return [contentLength, startPos];
}

export class MultipartStreamParser {
    private readonly onChunk: (chunk: StreamingChunk) => void;
    private buffer: Uint8Array;
    private readonly boundaryBytes: Uint8Array;
    private readonly decoder: TextDecoder;
    private bufferPos: number;

    constructor(onChunk: (chunk: StreamingChunk) => void, boundary = 'boundary') {
        this.onChunk = onChunk;
        this.buffer = new Uint8Array(0);
        this.boundaryBytes = new TextEncoder().encode(`--${boundary}\r\n`);
        this.decoder = new TextDecoder();
        this.bufferPos = 0;
    }

    processBuffer(chunk: Uint8Array): void {
        // Append new data to buffer
        const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
        newBuffer.set(this.buffer);
        newBuffer.set(chunk, this.buffer.length);
        this.buffer = newBuffer;

        while (this.bufferPos < this.buffer.length) {
            const boundaryPos = arrayIndexOf(this.buffer, this.boundaryBytes, this.bufferPos);
            if (boundaryPos === -1) {
                // Keep last boundary length bytes in case boundary is split between chunks
                if (this.buffer.length > this.boundaryBytes.length) {
                    const partialBoundaryBuffer = new Uint8Array(this.boundaryBytes.length);
                    partialBoundaryBuffer.set(
                        this.buffer.slice(this.buffer.length - this.boundaryBytes.length),
                    );
                    this.buffer = partialBoundaryBuffer;
                }
                this.bufferPos = 0;
                break;
            }

            const pos = boundaryPos + this.boundaryBytes.length;
            const [contentLength, contentStart] = getContentHeadersData(this.buffer, pos);

            if (contentStart === pos || !contentLength) {
                this.bufferPos = boundaryPos;
                break;
            }

            const contentEnd = contentStart + contentLength;
            if (contentEnd > this.buffer.length) {
                this.bufferPos = boundaryPos;
                break;
            }

            const content = this.decoder.decode(this.buffer.slice(contentStart, contentEnd));

            try {
                const parsedChunk = JSON.parse(content) as StreamingChunk;
                this.onChunk(parsedChunk);
            } catch (e) {
                // Skip invalid JSON chunks
                console.log(e);
            }

            this.bufferPos = contentEnd;
        }

        // Compact buffer if we've processed some data
        if (this.bufferPos > 0) {
            const compactedBuffer = new Uint8Array(this.buffer.length - this.bufferPos);
            compactedBuffer.set(this.buffer.slice(this.bufferPos));
            this.buffer = compactedBuffer;
            this.bufferPos = 0;
        }
    }
}
