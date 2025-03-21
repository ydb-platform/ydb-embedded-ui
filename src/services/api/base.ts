import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import axiosRetry from 'axios-retry';

import {backend as BACKEND} from '../../store';
import {DEV_ENABLE_TRACING_FOR_ALL_REQUESTS} from '../../utils/constants';
import {isRedirectToAuth} from '../../utils/response';
import {settingsManager} from '../settings';

export type AxiosOptions = {
    concurrentId?: string;
    signal?: AbortSignal;
    withRetries?: boolean;
    timeout?: number;
};

export class BaseYdbAPI extends AxiosWrapper {
    DEFAULT_RETRIES_COUNT = 0;

    constructor(options?: AxiosWrapperOptions) {
        super(options);

        axiosRetry(this._axios, {
            retries: this.DEFAULT_RETRIES_COUNT,
            retryDelay: axiosRetry.exponentialDelay,
        });

        // Make possible manually enable tracing for all requests
        // For development purposes
        this._axios.interceptors.request.use(function (config) {
            const enableTracing = settingsManager.readUserSettingsValue(
                DEV_ENABLE_TRACING_FOR_ALL_REQUESTS,
            );

            if (enableTracing) {
                config.headers['X-Want-Trace'] = 1;
            }

            return config;
        });

        // Add traceId to response if it exists
        this._axios.interceptors.response.use(function (response) {
            if (
                response.data &&
                response.data instanceof Object &&
                !Array.isArray(response.data) &&
                response.headers['traceresponse']
            ) {
                const traceId = response.headers['traceresponse'].split('-')[1];

                response.data = {
                    ...response.data,
                    _meta: {...response.data._meta, traceId},
                };
            }

            return response;
        });

        // Interceptor to process OIDC auth
        this._axios.interceptors.response.use(null, function (error) {
            const response = error.response;

            // OIDC proxy returns 401 response with authUrl in it
            // authUrl - external auth service link, after successful auth additional cookies will be appended
            // that will allow access to clusters where OIDC proxy is a balancer
            if (isRedirectToAuth(response)) {
                window.location.assign(response.data.authUrl);
            }

            return Promise.reject(error);
        });
    }

    getPath(path: string) {
        return `${BACKEND ?? ''}${path}`;
    }

    prepareArrayRequestParam(arr: (string | number)[]) {
        return arr.join(',');
    }
}
