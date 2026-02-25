import {parseMultipart} from '@mjackson/multipart-parser';
import qs from 'qs';

import {
    isErrorChunk,
    isKeepAliveChunk,
    isQueryResponseChunk,
    isSessionChunk,
    isStreamDataChunk,
} from '../../store/reducers/query/utils';
import {readSettingValueFromLS} from '../../store/reducers/settings/utils';
import type {Actions, StreamQueryParams} from '../../types/api/query';
import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
    StreamingChunk,
} from '../../types/store/streaming';
import {DEV_ENABLE_TRACING_FOR_ALL_REQUESTS} from '../../utils/constants';
import {isRedirectToAuth} from '../../utils/response';

import {BaseYdbAPI} from './base';
import type {StreamWorkerRequest, StreamWorkerResponse} from './streaming.worker.types';

const BOUNDARY = 'boundary';

export interface StreamQueryOptions {
    signal?: AbortSignal;
    onStreamDataChunk: (chunk: StreamDataChunk) => void;
    onQueryResponseChunk: (chunk: QueryResponseChunk) => void;
    onSessionChunk: (chunk: SessionChunk) => void;
}

let sharedWorker: Worker | null = null;
let workerCreationFailed = false;

function getOrCreateWorker(): Worker | null {
    if (workerCreationFailed) {
        return null;
    }

    if (sharedWorker) {
        return sharedWorker;
    }

    try {
        sharedWorker = new Worker(new URL('./streaming.worker.ts', import.meta.url));
        return sharedWorker;
    } catch (e) {
        console.warn('[StreamingAPI] Worker creation failed, falling back to main thread:', e);
        workerCreationFailed = true;
        return null;
    }
}

let requestCounter = 0;

function generateRequestId(): string {
    requestCounter += 1;
    return `stream-${requestCounter}-${Date.now()}`;
}

export class StreamingAPI extends BaseYdbAPI {
    private csrfToken?: string;

    setCSRFToken = (token: string) => {
        this.csrfToken = token;
    };

    async streamQuery<Action extends Actions>(
        params: StreamQueryParams<Action>,
        options: StreamQueryOptions,
    ) {
        const worker = getOrCreateWorker();

        if (worker) {
            return this.streamQueryViaWorker(params, options, worker);
        }

        return this.streamQueryOnMainThread(params, options);
    }

    private buildRequestParams<Action extends Actions>(params: StreamQueryParams<Action>) {
        const base64 = params.base64;

        const queryParams = qs.stringify(
            {timeout: params.timeout, base64, schema: 'multipart'},
            {encoder: encodeURIComponent},
        );

        const url = `${this.getPath('/viewer/query')}?${queryParams}`;

        const headers: Record<string, string> = {
            Accept: 'multipart/form-data',
            'Content-Type': 'application/json',
        };

        if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        if (params.tracingLevel) {
            headers['X-Trace-Verbosity'] = String(params.tracingLevel);
        }

        const enableTracing = readSettingValueFromLS(DEV_ENABLE_TRACING_FOR_ALL_REQUESTS);
        if (enableTracing) {
            headers['X-Want-Trace'] = '1';
        }

        const body = {...params, base64, schema: 'multipart'};
        const credentials: RequestCredentials = this._axios.defaults.withCredentials
            ? 'include'
            : 'same-origin';

        return {url, headers, body: JSON.stringify(body), credentials};
    }

    private async streamQueryViaWorker<Action extends Actions>(
        params: StreamQueryParams<Action>,
        options: StreamQueryOptions,
        worker: Worker,
    ) {
        const {url, headers, body, credentials} = this.buildRequestParams(params);
        const requestId = generateRequestId();

        return new Promise<void>((resolve, reject) => {
            let settled = false;

            function handleMessage(event: MessageEvent<StreamWorkerResponse>) {
                const msg = event.data;
                if (msg.requestId !== requestId) {
                    return;
                }

                switch (msg.type) {
                    case 'session':
                        options.onSessionChunk(msg.chunk);
                        break;
                    case 'data':
                        options.onStreamDataChunk(msg.chunk);
                        break;
                    case 'response':
                        options.onQueryResponseChunk(msg.chunk);
                        break;
                    case 'keepalive':
                        break;
                    case 'auth-redirect':
                        cleanup();
                        settled = true;
                        window.location.assign(msg.authUrl);
                        resolve();
                        break;
                    case 'error':
                        cleanup();
                        settled = true;
                        reject(msg.error);
                        break;
                    case 'done':
                        cleanup();
                        settled = true;
                        resolve();
                        break;
                }
            }

            function handleError(event: ErrorEvent) {
                cleanup();
                if (sharedWorker === worker) {
                    sharedWorker.terminate();
                    sharedWorker = null;
                }
                if (!settled) {
                    settled = true;
                    reject(new Error(event.message || 'Worker error'));
                }
            }

            function cleanup() {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                if (options.signal) {
                    options.signal.removeEventListener('abort', handleAbort);
                }
            }

            function handleAbort() {
                const abortMessage: StreamWorkerRequest = {type: 'abort', requestId};
                worker.postMessage(abortMessage);
                cleanup();
                if (!settled) {
                    settled = true;
                    reject(new DOMException('The operation was aborted.', 'AbortError'));
                }
            }

            if (options.signal?.aborted) {
                reject(new DOMException('The operation was aborted.', 'AbortError'));
                return;
            }

            worker.addEventListener('message', handleMessage);
            worker.addEventListener('error', handleError);

            if (options.signal) {
                options.signal.addEventListener('abort', handleAbort);
            }

            const startMessage: StreamWorkerRequest = {
                type: 'start',
                requestId,
                url,
                headers,
                body,
                credentials,
            };
            worker.postMessage(startMessage);
        });
    }

    /** Fallback: original main-thread implementation for environments without Worker support */
    private async streamQueryOnMainThread<Action extends Actions>(
        params: StreamQueryParams<Action>,
        options: StreamQueryOptions,
    ) {
        const {url, headers: headersRecord, body, credentials} = this.buildRequestParams(params);

        const response = await fetch(url, {
            method: 'POST',
            signal: options.signal,
            headers: headersRecord,
            credentials,
            body,
        });

        if (!response.ok) {
            const responseData = await response.json().catch(() => ({}));
            if (isRedirectToAuth({status: response.status, data: responseData})) {
                window.location.assign(responseData.authUrl);
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
                const sessionChunk = streamingChunk;
                sessionChunk.meta.trace_id = traceId;
                options.onSessionChunk(streamingChunk);
            } else if (isStreamDataChunk(streamingChunk)) {
                options.onStreamDataChunk(streamingChunk);
            } else if (isQueryResponseChunk(streamingChunk)) {
                options.onQueryResponseChunk(streamingChunk);
            } else if (isKeepAliveChunk(streamingChunk)) {
                console.info('Received keep alive chunk');
            }
        });
    }
}
