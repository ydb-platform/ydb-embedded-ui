import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosWrapperOptions} from '@gravity-ui/axios-wrapper';
import axiosRetry from 'axios-retry';

import {backend as BACKEND, clusterName} from '../../store';
import {readSettingValueFromLS} from '../../store/reducers/settings/utils';
import type {SchemaPathParam} from '../../types/api/common';
import {DEV_ENABLE_TRACING_FOR_ALL_REQUESTS} from '../../utils/constants';
import {prepareBackendWithMetaProxy} from '../../utils/parseBalancer';
import {isRedirectToAuth} from '../../utils/response';

import {isNeedResetResponse, processNeedReset} from './utils/needReset';

export type AxiosOptions = {
    concurrentId?: string;
    signal?: AbortSignal;
    withRetries?: boolean;
    timeout?: number;
};

export interface BaseAPIParams {
    singleClusterMode: undefined | boolean;
    proxyMeta: undefined | boolean;
    useRelativePath: undefined | boolean;
}

interface XhrLikeRequest {
    readyState: number;
    status: number;
    statusText?: string;
    responseText?: string;
    responseURL?: string;
    getAllResponseHeaders: () => string;
}

interface RecoveredNetworkResponse {
    status: number;
    statusText: string;
    data?: unknown;
    headers: Record<string, string>;
    config: Record<string, unknown>;
    request: XhrLikeRequest;
    code?: string;
    message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isXhrLikeRequest(request: unknown): request is XhrLikeRequest {
    return Boolean(
        isRecord(request) &&
            typeof request.readyState === 'number' &&
            typeof request.status === 'number' &&
            typeof request.getAllResponseHeaders === 'function',
    );
}

function parseXhrResponseHeaders(rawHeaders: string): Record<string, string> {
    if (!rawHeaders.trim()) {
        return {};
    }

    const headers: Record<string, string> = {};

    for (const line of rawHeaders.split(/\r?\n/)) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex <= 0) {
            continue;
        }

        const headerName = line.slice(0, separatorIndex).trim().toLowerCase();
        const headerValue = line.slice(separatorIndex + 1).trim();

        if (!headerName || !headerValue) {
            continue;
        }

        headers[headerName] = headers[headerName]
            ? `${headers[headerName]}, ${headerValue}`
            : headerValue;
    }

    return headers;
}

function parseRecoveredResponseData(
    responseText: string | undefined,
    headers: Record<string, string>,
): unknown {
    if (typeof responseText !== 'string') {
        return undefined;
    }

    const trimmedResponse = responseText.trim();
    if (!trimmedResponse) {
        return responseText;
    }

    const contentType = headers['content-type']?.toLowerCase();
    const shouldParseJson =
        Boolean(contentType?.includes('json')) ||
        trimmedResponse.startsWith('{') ||
        trimmedResponse.startsWith('[');

    if (!shouldParseJson) {
        return responseText;
    }

    try {
        return JSON.parse(responseText) as unknown;
    } catch {
        return responseText;
    }
}

export function recoverXhrResponseFromNetworkError(
    error: unknown,
): RecoveredNetworkResponse | undefined {
    if (!isRecord(error) || error.code !== 'ERR_NETWORK' || error.response) {
        return undefined;
    }

    const request = error.request;
    if (!isXhrLikeRequest(request) || request.readyState !== 4 || request.status <= 0) {
        return undefined;
    }

    const headers = parseXhrResponseHeaders(request.getAllResponseHeaders());
    const config = isRecord(error.config) ? {...error.config} : {};

    if (request.responseURL) {
        config.url = request.responseURL;
    }

    const recoveredResponse: RecoveredNetworkResponse = {
        status: request.status,
        statusText: typeof request.statusText === 'string' ? request.statusText : '',
        data: parseRecoveredResponseData(request.responseText, headers),
        headers,
        config,
        request,
    };

    if (typeof error.code === 'string') {
        recoveredResponse.code = error.code;
    }

    if (typeof error.message === 'string') {
        recoveredResponse.message = error.message;
    }

    Object.assign(error, {
        response: recoveredResponse,
        status: request.status,
    });

    return recoveredResponse;
}

export function handleBaseApiResponseError(error: unknown): Promise<never> {
    recoverXhrResponseFromNetworkError(error);

    const response =
        isRecord(error) && 'response' in error && isRecord(error.response)
            ? error.response
            : undefined;

    if (isRedirectToAuth(response)) {
        window.location.assign(response.data.authUrl);
    }

    if (isNeedResetResponse(response?.data) && document.visibilityState === 'visible') {
        processNeedReset();
    }

    return Promise.reject(error);
}

export class BaseYdbAPI extends AxiosWrapper {
    DEFAULT_RETRIES_COUNT = 0;

    singleClusterMode: BaseAPIParams['singleClusterMode'];
    useRelativePath: BaseAPIParams['useRelativePath'];

    constructor(axiosOptions: AxiosWrapperOptions, baseApiParams: BaseAPIParams) {
        super(axiosOptions);

        this.singleClusterMode = baseApiParams.singleClusterMode;
        this.useRelativePath = baseApiParams.useRelativePath;

        axiosRetry(this._axios, {
            retries: this.DEFAULT_RETRIES_COUNT,
            retryDelay: axiosRetry.exponentialDelay,
        });

        // Make possible manually enable tracing for all requests
        // For development purposes
        this._axios.interceptors.request.use(function (config) {
            const enableTracing = readSettingValueFromLS(DEV_ENABLE_TRACING_FOR_ALL_REQUESTS);

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

        // Interceptor to process OIDC auth and NEED_RESET
        this._axios.interceptors.response.use(null, handleBaseApiResponseError);
    }

    getPath(path: string) {
        if (clusterName && !this.singleClusterMode && !BACKEND) {
            return prepareBackendWithMetaProxy({clusterName}) + path;
        }

        return `${BACKEND ?? ''}${path}`;
    }

    getSchemaPath(params?: SchemaPathParam) {
        const {path, databaseFullPath, useMetaProxy} = params ?? {};
        if (!this.useRelativePath || !path || !databaseFullPath || !useMetaProxy) {
            return path;
        }

        if (path === databaseFullPath) {
            return '';
        }

        if (path.startsWith(databaseFullPath + '/')) {
            return path.slice(databaseFullPath.length + 1);
        }
        return path;
    }

    prepareArrayRequestParam(arr: (string | number)[]) {
        return arr.join(',');
    }
}
