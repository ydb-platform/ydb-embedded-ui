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
import {USEFUL_HEADERS} from '../../utils/errors/extractErrorDetails';
import {isRedirectToAuth} from '../../utils/response';

import {BaseYdbAPI} from './base';
import {readPartText} from './streamingPartReader';
import {isNeedResetResponse, processNeedResetStatus} from './utils/needReset';

/**
 * Extracts useful headers from a fetch Response into a plain object.
 * Only includes headers that extractErrorDetails knows how to use.
 */
function extractResponseHeaders(response: Response): Record<string, string> {
    const result: Record<string, string> = {};
    const headerNames = USEFUL_HEADERS.map(({header}) => header);
    for (const name of headerNames) {
        const value = response.headers.get(name);
        if (value) {
            result[name] = value;
        }
    }
    return result;
}

/**
 * Creates a structured error from a fetch Response.
 * Returns a real Error (with stack trace and instanceof support) enriched
 * with the fields that extractErrorDetails expects (status, statusText, headers, data, config).
 */
function createStreamingResponseError(response: Response, responseData: unknown): Error {
    const message = `${response.status} ${response.statusText || 'Error'}`;
    const error = new Error(message);
    return Object.assign(error, {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: extractResponseHeaders(response),
        config: {url: response.url, method: 'POST'},
    });
}

const BOUNDARY = 'boundary';

export interface StreamQueryOptions {
    signal?: AbortSignal;
    onStreamDataChunk: (chunk: StreamDataChunk) => void;
    onQueryResponseChunk: (chunk: QueryResponseChunk) => void;
    onSessionChunk: (chunk: SessionChunk) => void;
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
        const base64 = params.base64;

        const queryParams = qs.stringify(
            {timeout: params.timeout, base64, schema: 'multipart'},
            {encoder: encodeURIComponent},
        );

        const body = {...params, base64, schema: 'multipart'};
        const headers = new Headers({
            Accept: 'multipart/form-data',
            'Content-Type': 'application/json',
        });

        if (this.csrfToken) {
            headers.set('X-CSRF-Token', this.csrfToken);
        }

        if (params.tracingLevel) {
            headers.set('X-Trace-Verbosity', String(params.tracingLevel));
        }

        const enableTracing = readSettingValueFromLS(DEV_ENABLE_TRACING_FOR_ALL_REQUESTS);

        if (enableTracing) {
            headers.set('X-Want-Trace', '1');
        }

        const url = `${this.getPath('/viewer/query')}?${queryParams}`;
        let response: Response;
        try {
            response = await fetch(url, {
                method: 'POST',
                signal: options.signal,
                headers,
                credentials: this._axios.defaults.withCredentials ? 'include' : 'same-origin',
                body: JSON.stringify(body),
            });
        } catch (fetchError) {
            const enriched =
                fetchError instanceof Error ? fetchError : new Error(String(fetchError));
            Object.assign(enriched, {
                config: {url, method: 'POST'},
                errorPhase: 'connection',
                networkOnline: navigator.onLine,
            });
            throw enriched;
        }

        if (!response.ok) {
            const responseData = await response
                .text()
                .then((text) => {
                    try {
                        return JSON.parse(text) as unknown;
                    } catch {
                        return text || undefined;
                    }
                })
                .catch(() => undefined);
            if (isRedirectToAuth({status: response.status, data: responseData})) {
                const data = responseData as {authUrl: string};
                window.location.assign(data.authUrl);
                return;
            }
            if (isNeedResetResponse(responseData)) {
                processNeedResetStatus();
            }
            throw createStreamingResponseError(response, responseData);
        }

        if (!response.body) {
            const error = new Error('Empty response body');
            Object.assign(error, {
                status: response.status,
                statusText: response.statusText,
                config: {url, method: 'POST'},
                headers: extractResponseHeaders(response),
            });
            throw error;
        }

        const traceId = response.headers.get('traceresponse')?.split('-')[1];

        try {
            await parseMultipart(response.body, {boundary: BOUNDARY}, async (part) => {
                const text = await readPartText(part);

                let chunk: unknown;
                try {
                    chunk = JSON.parse(text);
                } catch (e) {
                    const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;
                    throw new Error(`Error parsing chunk: ${e}\nRaw: ${preview}`);
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
        } catch (streamError) {
            if (isErrorChunk(streamError)) {
                throw streamError;
            }
            const enriched =
                streamError instanceof Error ? streamError : new Error(String(streamError));
            Object.assign(enriched, {
                config: {url, method: 'POST'},
                headers: extractResponseHeaders(response),
                errorPhase: 'stream',
            });
            throw enriched;
        }
    }
}
