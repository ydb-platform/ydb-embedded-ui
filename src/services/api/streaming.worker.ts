import {parseMultipart} from '@mjackson/multipart-parser';

import {
    isErrorChunk,
    isKeepAliveChunk,
    isQueryResponseChunk,
    isSessionChunk,
    isStreamDataChunk,
} from '../../store/reducers/query/utils';
import type {StreamingChunk} from '../../types/store/streaming';

import type {StreamWorkerRequest, StreamWorkerResponse} from './streaming.worker.types';

const BOUNDARY = 'boundary';

const activeRequests = new Map<string, AbortController>();

function postResponse(message: StreamWorkerResponse) {
    self.postMessage(message);
}

function isAuthRedirectResponse(status: number, data: unknown): data is {authUrl: string} {
    return Boolean(
        status === 401 && data && typeof data === 'object' && 'authUrl' in data && data.authUrl,
    );
}

async function handleStreamRequest(msg: {
    requestId: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    credentials: RequestCredentials;
}) {
    const {requestId, url, headers, body, credentials} = msg;

    const controller = new AbortController();
    activeRequests.set(requestId, controller);

    try {
        const response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers,
            credentials,
            body,
        });

        if (!response.ok) {
            const responseData = await response.json().catch(() => ({}));

            if (isAuthRedirectResponse(response.status, responseData)) {
                postResponse({
                    type: 'auth-redirect',
                    requestId,
                    authUrl: (responseData as {authUrl: string}).authUrl,
                });
                return;
            }

            throw new Error(`${response.status}`);
        }

        if (!response.body) {
            throw new Error('Empty response body');
        }

        const traceId = response.headers.get('traceresponse')?.split('-')[1];

        await parseMultipart(response.body, {boundary: BOUNDARY}, async (part) => {
            const text = await part.text();

            let chunk: unknown;
            try {
                chunk = JSON.parse(text);
            } catch (e) {
                throw new Error(`Error parsing chunk: ${e}`);
            }

            if (isErrorChunk(chunk)) {
                await response.body?.cancel().catch(() => {});
                throw chunk;
            }

            const streamingChunk = chunk as StreamingChunk;

            if (isSessionChunk(streamingChunk)) {
                streamingChunk.meta.trace_id = traceId;
                postResponse({type: 'session', requestId, chunk: streamingChunk});
            } else if (isStreamDataChunk(streamingChunk)) {
                postResponse({type: 'data', requestId, chunk: streamingChunk});
            } else if (isQueryResponseChunk(streamingChunk)) {
                postResponse({type: 'response', requestId, chunk: streamingChunk});
            } else if (isKeepAliveChunk(streamingChunk)) {
                postResponse({type: 'keepalive', requestId});
            }
        });

        postResponse({type: 'done', requestId});
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            // Request was intentionally aborted, no need to report
            return;
        }
        postResponse({
            type: 'error',
            requestId,
            error: error instanceof Error ? {message: error.message} : error,
        });
    } finally {
        activeRequests.delete(requestId);
    }
}

self.onmessage = (event: MessageEvent<StreamWorkerRequest>) => {
    const msg = event.data;

    if (msg.type === 'start') {
        handleStreamRequest(msg);
    } else if (msg.type === 'abort') {
        const controller = activeRequests.get(msg.requestId);
        if (controller) {
            controller.abort();
            activeRequests.delete(msg.requestId);
        }
    }
};
