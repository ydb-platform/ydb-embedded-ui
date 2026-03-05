import type {Page} from '@playwright/test';

export interface MockStreamingOptions {
    /** Interval between data chunks in ms (default: 200) */
    chunkIntervalMs?: number;
    /**
     * When set, the stream will send this many data chunks followed by a
     * QueryResponse chunk and then close.  When omitted the stream runs
     * indefinitely (useful for "stop" / abort tests).
     */
    totalChunks?: number;
    /**
     * When set, the stream will send data chunks and then a QueryResponse
     * with error/issues fields, simulating a server-side query error.
     * Takes precedence over normal completion when both totalChunks and
     * errorAfterChunks are set.
     */
    errorAfterChunks?: number;
}

/**
 * Monkey-patches `window.fetch` in the browser context to intercept streaming
 * query requests (`/viewer/query?…schema=multipart`) and return a controlled
 * `ReadableStream` that delivers multipart chunks at a steady pace.
 *
 * The mock reproduces the real YDB multipart format:
 *   --boundary\r\nContent-Type: …\r\nContent-Length: …\r\n\r\n{JSON}\r\n
 *
 * This keeps the main thread responsive (Safari freezes during high-frequency
 * real streaming) while exercising the full streaming / abort flow.
 *
 * Must be called **after** the page has loaded and **before** the query is run.
 */
export async function setupMockStreamingFetch(
    page: Page,
    options: MockStreamingOptions = {},
): Promise<void> {
    const chunkIntervalMs = options.chunkIntervalMs ?? 200;
    const totalChunks = options.totalChunks ?? null;
    const errorAfterChunks = options.errorAfterChunks ?? null;

    await page.evaluate(
        ({chunkIntervalMs: interval, totalChunks: total, errorAfterChunks: errorAfter}) => {
            const originalFetch = window.fetch;

            window.fetch = function (
                input: RequestInfo | URL,
                init?: RequestInit,
            ): Promise<Response> {
                let url: string;
                if (typeof input === 'string') {
                    url = input;
                } else if (input instanceof URL) {
                    url = input.href;
                } else {
                    url = input.url;
                }

                const isStreamingQuery =
                    url.includes('/viewer/query') && url.includes('schema=multipart');

                if (!isStreamingQuery) {
                    return originalFetch.call(window, input, init);
                }

                return Promise.resolve(createMockStreamingResponse(init?.signal));
            };

            function createMockStreamingResponse(signal?: AbortSignal | null): Response {
                const encoder = new TextEncoder();
                const BOUNDARY = 'boundary';

                const sessionJSON = JSON.stringify({
                    version: 10,
                    meta: {
                        node_id: 1,
                        event: 'SessionCreated',
                        query_id: 'mock-query-1',
                        session_id: 'mock-session-1',
                    },
                });

                const queryResponseJSON = JSON.stringify({
                    status: 'SUCCESS',
                    meta: {event: 'QueryResponse'},
                });

                const errorResponseJSON = JSON.stringify({
                    error: {
                        severity: 1,
                        message: 'Mock streaming error',
                    },
                    issues: [
                        {
                            severity: 1,
                            message: 'Mock streaming error',
                        },
                    ],
                    status: 'GENERIC_ERROR',
                    meta: {event: 'QueryResponse'},
                });

                function dataChunkJSON(seqNo: number): string {
                    return JSON.stringify({
                        result: {
                            rows: [[String(seqNo + 1)]],
                            columns: seqNo === 0 ? [{name: 'x', type: 'Uint64'}] : undefined,
                        },
                        meta: {seq_no: seqNo + 1, result_index: 0, event: 'StreamData'},
                    });
                }

                function encodePart(json: string): Uint8Array {
                    const jsonBytes = encoder.encode(json);
                    const header = `--${BOUNDARY}\r\nContent-Type: application/json\r\nContent-Length: ${jsonBytes.byteLength}\r\n\r\n`;
                    const headerBytes = encoder.encode(header);
                    const suffix = encoder.encode('\r\n');
                    const part = new Uint8Array(
                        headerBytes.byteLength + jsonBytes.byteLength + suffix.byteLength,
                    );
                    part.set(headerBytes, 0);
                    part.set(jsonBytes, headerBytes.byteLength);
                    part.set(suffix, headerBytes.byteLength + jsonBytes.byteLength);
                    return part;
                }

                function encodeClosingBoundary(): Uint8Array {
                    return encoder.encode(`--${BOUNDARY}--\r\n`);
                }

                // Determine how the stream should end
                const shouldError = errorAfter !== null;
                const chunkLimit = shouldError ? errorAfter : total;

                let intervalId: number;
                let chunkIndex = 0;

                const stream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        // Send session chunk immediately
                        controller.enqueue(encodePart(sessionJSON));

                        // Deliver data chunks at steady intervals
                        intervalId = window.setInterval(() => {
                            try {
                                // Check if we should terminate
                                if (chunkLimit !== null && chunkIndex >= chunkLimit) {
                                    window.clearInterval(intervalId);
                                    const responseJSON = shouldError
                                        ? errorResponseJSON
                                        : queryResponseJSON;
                                    controller.enqueue(encodePart(responseJSON));
                                    controller.enqueue(encodeClosingBoundary());
                                    controller.close();
                                    return;
                                }

                                controller.enqueue(encodePart(dataChunkJSON(chunkIndex)));
                                chunkIndex++;
                            } catch {
                                window.clearInterval(intervalId);
                            }
                        }, interval);

                        if (signal) {
                            const onAbort = () => {
                                window.clearInterval(intervalId);
                                try {
                                    controller.error(
                                        new DOMException(
                                            'The operation was aborted.',
                                            'AbortError',
                                        ),
                                    );
                                } catch {
                                    // stream may already be errored/closed
                                }
                            };

                            if (signal.aborted) {
                                onAbort();
                                return;
                            }

                            signal.addEventListener('abort', onAbort, {once: true});
                        }
                    },
                    cancel() {
                        window.clearInterval(intervalId);
                    },
                });

                return new Response(stream, {
                    status: 200,
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
                    },
                });
            }
        },
        {chunkIntervalMs, totalChunks, errorAfterChunks},
    );
}
