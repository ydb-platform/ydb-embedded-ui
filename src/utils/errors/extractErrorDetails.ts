import type {IResponseErrorMeta} from '../../types/api/error';
import {isNetworkError, isResponseError, isResponseErrorWithIssues} from '../response';

export interface ErrorDetails {
    status?: number;
    statusText?: string;
    traceId?: string;
    requestUrl?: string;
    method?: string;
    errorCode?: string;
    hasIssues?: boolean;
}

function getMeta(error: object): IResponseErrorMeta | undefined {
    if ('_meta' in error && error._meta && typeof error._meta === 'object') {
        return error._meta as IResponseErrorMeta;
    }
    return undefined;
}

function extractFromResponseError(error: unknown): ErrorDetails | null {
    if (!isResponseError(error)) {
        return null;
    }

    const meta = getMeta(error);

    const details: ErrorDetails = {
        status: error.status || undefined,
        statusText: error.statusText || undefined,
        traceId: meta?.traceId,
        requestUrl: meta?.requestUrl,
        method: meta?.method,
        hasIssues: isResponseErrorWithIssues(error) || undefined,
    };

    const hasAnyDetail = Object.values(details).some(Boolean);
    return hasAnyDetail ? details : null;
}

function extractNetworkConfig(error: object): Pick<ErrorDetails, 'requestUrl' | 'method'> {
    if (!('config' in error) || !error.config || typeof error.config !== 'object') {
        return {};
    }
    const config = error.config as Record<string, unknown>;
    return {
        requestUrl: typeof config.url === 'string' ? config.url : undefined,
        method: typeof config.method === 'string' ? config.method.toUpperCase() : undefined,
    };
}

function extractFromNetworkError(error: unknown): ErrorDetails | null {
    if (!isNetworkError(error)) {
        return null;
    }

    const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    const {requestUrl, method} = extractNetworkConfig(error);

    if (!errorCode && !requestUrl) {
        return null;
    }

    return {errorCode, requestUrl, method};
}

export function extractErrorDetails(error: unknown): ErrorDetails | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    return extractFromResponseError(error) ?? extractFromNetworkError(error);
}
