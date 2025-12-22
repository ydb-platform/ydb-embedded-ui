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

        const response = await fetch(`${this.getPath('/viewer/query')}?${queryParams}`, {
            method: 'POST',
            signal: options.signal,
            headers,
            credentials: this._axios.defaults.withCredentials ? 'include' : 'same-origin',
            body: JSON.stringify(body),
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
                // Logging for debug purposes
                console.info('Received keep alive chunk');
            }
        });
    }
}
