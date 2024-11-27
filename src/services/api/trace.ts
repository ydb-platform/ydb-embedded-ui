import {SECOND_IN_MS} from '../../utils/constants';
import {isAxiosError} from '../../utils/response';

import type {AxiosOptions} from './base';
import {BaseYdbAPI} from './base';

const TRACE_RETRY_DELAY = 4 * SECOND_IN_MS;
const TRACE_CHECK_TIMEOUT = 10 * SECOND_IN_MS;
const TRACE_API_ERROR_RETRY_DELAY = 10 * SECOND_IN_MS;
const MAX_TRACE_CHECK_RETRIES = 30;

export class TraceAPI extends BaseYdbAPI {
    checkTrace({url}: {url: string}, {concurrentId, signal}: AxiosOptions = {}) {
        return this.get(
            url,
            {},
            {
                concurrentId: concurrentId || 'checkTrace',
                requestConfig: {
                    signal,
                    timeout: TRACE_CHECK_TIMEOUT,
                    'axios-retry': {
                        retries: MAX_TRACE_CHECK_RETRIES,
                        retryDelay: (_: number, error: unknown) => {
                            const isTracingError =
                                isAxiosError(error) &&
                                (error?.response?.status === 404 || error.code === 'ERR_NETWORK');

                            if (isTracingError) {
                                return TRACE_RETRY_DELAY;
                            }

                            return TRACE_API_ERROR_RETRY_DELAY;
                        },
                        shouldResetTimeout: true,
                        retryCondition: () => true,
                    },
                },
            },
        );
    }
}
