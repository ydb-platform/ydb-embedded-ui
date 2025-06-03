import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import {parseMultipart} from '@mjackson/multipart-parser';
import qs from 'qs';

import {
    isKeepAliveChunk,
    isQueryResponseChunk,
    isSessionChunk,
    isStreamDataChunk,
} from '../../store/reducers/query/utils';
import type {Actions, StreamQueryParams} from '../../types/api/query';
import type {QueryResponseChunk, SessionChunk, StreamDataChunk} from '../../types/store/streaming';
import {
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    DEV_ENABLE_TRACING_FOR_ALL_REQUESTS,
} from '../../utils/constants';
import {isRedirectToAuth} from '../../utils/response';
import {settingsManager} from '../settings';

import {BaseYdbAPI} from './base';

const BOUNDARY = 'boundary';

export interface StreamQueryOptions {
    signal?: AbortSignal;
    onStreamDataChunk: (chunk: StreamDataChunk) => void;
    onQueryResponseChunk: (chunk: QueryResponseChunk) => void;
    onSessionChunk: (chunk: SessionChunk) => void;
}

export class StreamingAPI extends BaseYdbAPI {
    withCredentials?: boolean;

    constructor(options: AxiosWrapperOptions) {
        super(options);

        this.withCredentials = options.config?.withCredentials;
    }

    async streamQuery<Action extends Actions>(
        params: StreamQueryParams<Action>,
        options: StreamQueryOptions,
    ) {
        const base64 = !settingsManager.readUserSettingsValue(
            BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
            true,
        );

        const queryParams = qs.stringify(
            {timeout: params.timeout, base64, schema: 'multipart'},
            {encoder: encodeURIComponent},
        );

        const body = {...params, base64, schema: 'multipart'};
        const headers = new Headers({
            Accept: 'multipart/form-data',
            'Content-Type': 'application/json',
        });

        if (params.tracingLevel) {
            headers.set('X-Trace-Verbosity', String(params.tracingLevel));
        }

        const enableTracing = settingsManager.readUserSettingsValue(
            DEV_ENABLE_TRACING_FOR_ALL_REQUESTS,
        );

        if (enableTracing) {
            headers.set('X-Want-Trace', '1');
        }

        const response = await fetch(`${this.getPath('/viewer/query')}?${queryParams}`, {
            method: 'POST',
            signal: options.signal,
            headers,
            credentials: this.withCredentials ? 'include' : 'same-origin',
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
            try {
                const chunk = JSON.parse(await part.text());

                if (isSessionChunk(chunk)) {
                    const sessionChunk = chunk;
                    sessionChunk.meta.trace_id = traceId;
                    options.onSessionChunk(chunk);
                } else if (isStreamDataChunk(chunk)) {
                    options.onStreamDataChunk(chunk);
                } else if (isQueryResponseChunk(chunk)) {
                    options.onQueryResponseChunk(chunk);
                } else if (isKeepAliveChunk(chunk)) {
                    // Logging for debug purposes
                    console.log('Received keep alive chunk');
                }
            } catch (e) {
                throw new Error(`Error parsing chunk: ${e}`);
            }
        });
    }
}
