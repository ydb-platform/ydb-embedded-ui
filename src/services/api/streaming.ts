// eslint-disable-next-line import/no-extraneous-dependencies
import {parseMultipart} from '@mjackson/multipart-parser';
import qs from 'qs';

import {
    isQueryResponseChunk,
    isSessionChunk,
    isStreamDataChunk,
} from '../../store/reducers/query/utils';
import type {Actions, TracingLevel} from '../../types/api/query';
import type {QuerySyntax, StatisticsMode} from '../../types/store/query';
import type {QueryResponseChunk, SessionChunk, StreamDataChunk} from '../../types/store/streaming';
import {BINARY_DATA_IN_PLAIN_TEXT_DISPLAY} from '../../utils/constants';
import {settingsManager} from '../settings';

import {BaseYdbAPI} from './base';

const BOUNDARY = 'boundary';

export interface StreamQueryParams {
    query?: string;
    database?: string;
    action?: Actions;
    syntax?: QuerySyntax;
    stats?: StatisticsMode;
    tracingLevel?: TracingLevel;
    transaction_mode?: string;
    timeout?: number;
    limit_rows?: number;
    output_chunk_max_size: number;
    concurrent_results?: boolean;
}

export interface StreamQueryOptions {
    signal?: AbortSignal;
    onStreamDataChunk: (chunk: StreamDataChunk) => void;
    onQueryResponseChunk: (chunk: QueryResponseChunk) => void;
    onSessionChunk: (chunk: SessionChunk) => void;
}

export class StreamingAPI extends BaseYdbAPI {
    async streamQuery(params: StreamQueryParams, options: StreamQueryOptions) {
        const base64 = !settingsManager.readUserSettingsValue(
            BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
            true,
        );

        const queryParams = qs.stringify(
            {...params, base64, schema: 'multipart'},
            {encoder: encodeURIComponent},
        );

        const headers = new Headers({
            Accept: 'multipart/x-mixed-replace',
        });

        if (params.tracingLevel) {
            headers.set('X-Trace-Verbosity', String(params.tracingLevel));
        }

        const response = await fetch(`${this.getPath('/viewer/query')}?${queryParams}`, {
            method: 'GET',
            signal: options.signal,
            headers,
        });

        if (!response.ok) {
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
                }
            } catch (e) {
                throw new Error(`Error parsing chunk: ${e}`);
            }
        });
    }
}
