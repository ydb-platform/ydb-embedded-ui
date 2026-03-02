import type {IssueMessage} from '../../types/api/query';
import {isResponseErrorWithIssues} from '../response';

export interface ErrorDetails {
    status?: number;
    statusText?: string;
    traceId?: string;
    requestId?: string;
    proxyName?: string;
    workerName?: string;
    requestUrl?: string;
    method?: string;
    errorCode?: string;
    hasIssues?: boolean;
    issues?: IssueMessage[];
}

const USEFUL_HEADERS = [
    {header: 'traceresponse', key: 'traceId', transform: extractTraceIdFromTraceresponse},
    {header: 'x-trace-id', key: 'traceId', transform: undefined},
    {header: 'x-request-id', key: 'requestId', transform: undefined},
    {header: 'x-proxy-name', key: 'proxyName', transform: undefined},
    {header: 'x-worker-name', key: 'workerName', transform: undefined},
] as const;

function extractTraceIdFromTraceresponse(value: string): string {
    const parts = value.split('-');
    return parts.length >= 2 ? parts[1] : value;
}

function extractHeaders(headers: unknown): Partial<ErrorDetails> {
    if (!headers || typeof headers !== 'object') {
        return {};
    }

    const result: Record<string, string> = {};

    for (const {header, key, transform} of USEFUL_HEADERS) {
        if (key in result) {
            continue;
        }

        if (header in headers) {
            const value = (headers as Record<string, unknown>)[header];
            if (typeof value === 'string' && value) {
                result[key] = transform ? transform(value) : value;
            }
        }
    }

    return result;
}

function extractConfig(config: unknown): {url?: string; method?: string} {
    if (!config || typeof config !== 'object') {
        return {};
    }

    const result: {url?: string; method?: string} = {};

    if ('url' in config && typeof config.url === 'string') {
        result.url = config.url;
    }

    if ('method' in config && typeof config.method === 'string') {
        result.method = config.method.toUpperCase();
    }

    return result;
}

/**
 * Extracts metadata details from error objects for display in error UI.
 * Works with HTTP errors (from AxiosWrapper response), network errors (from AxiosWrapper toJSON),
 * and response errors with issues (HTTP 429).
 *
 * Returns null for primitives, cancelled requests, and objects without useful metadata.
 */
export function extractErrorDetails(error: unknown): ErrorDetails | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    if ('isCancelled' in error && error.isCancelled) {
        return null;
    }

    const details: ErrorDetails = {};
    let hasAnyDetail = false;

    if ('status' in error && typeof error.status === 'number') {
        details.status = error.status;
        hasAnyDetail = true;
    }

    if ('statusText' in error && typeof error.statusText === 'string') {
        details.statusText = error.statusText;
        hasAnyDetail = true;
    }

    if ('headers' in error) {
        const headerDetails = extractHeaders(error.headers);
        Object.assign(details, headerDetails);
        if (Object.keys(headerDetails).length > 0) {
            hasAnyDetail = true;
        }
    }

    if ('config' in error) {
        const {url, method} = extractConfig(error.config);
        if (url) {
            details.requestUrl = url;
            hasAnyDetail = true;
        }
        if (method) {
            details.method = method;
            hasAnyDetail = true;
        }
    }

    if ('code' in error && typeof error.code === 'string') {
        details.errorCode = error.code;
        hasAnyDetail = true;
    }

    if (isResponseErrorWithIssues(error) && error.data) {
        details.hasIssues = true;
        details.issues = error.data.issues as IssueMessage[];
        hasAnyDetail = true;
    }

    return hasAnyDetail ? details : null;
}
