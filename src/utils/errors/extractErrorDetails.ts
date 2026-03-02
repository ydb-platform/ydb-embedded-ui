import type {IssueMessage} from '../../types/api/query';
import {isResponseErrorWithIssues} from '../response';

export interface ErrorDetails {
    status?: number;
    statusText?: string;
    /** Brief error title for display: "{status} {statusText}" or "Network Error" */
    title?: string;
    /** Specific error message extracted from response data (data.error, data.message, etc.) */
    dataMessage?: string;
    traceId?: string;
    requestId?: string;
    proxyName?: string;
    workerName?: string;
    requestUrl?: string;
    method?: string;
    errorCode?: string;
    responseBody?: string;
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

const MAX_RESPONSE_BODY_LENGTH = 500;

function extractResponseBody(data: unknown): string | undefined {
    if (data === undefined || data === null || data === '') {
        return undefined;
    }

    if (typeof data === 'string') {
        const trimmed = data.trim();
        if (!trimmed) {
            return undefined;
        }
        if (trimmed.length > MAX_RESPONSE_BODY_LENGTH) {
            return trimmed.slice(0, MAX_RESPONSE_BODY_LENGTH) + '…';
        }
        return trimmed;
    }

    if (typeof data === 'object') {
        try {
            const json = JSON.stringify(data);
            if (json.length > MAX_RESPONSE_BODY_LENGTH) {
                return json.slice(0, MAX_RESPONSE_BODY_LENGTH) + '…';
            }
            return json;
        } catch {
            return undefined;
        }
    }

    return undefined;
}

/**
 * Short plain text responses can be used as the data message;
 * longer or formatted bodies are shown only in the Response disclosure.
 */
const MAX_DATA_MESSAGE_LENGTH = 200;

function isShortPlainText(value: string): boolean {
    return value.length <= MAX_DATA_MESSAGE_LENGTH && !value.trimStart().startsWith('<');
}

function extractDataMessage(data: unknown): string | undefined {
    if (!data) {
        return undefined;
    }

    if (typeof data === 'string') {
        const trimmed = data.trim();
        return trimmed && isShortPlainText(trimmed) ? trimmed : undefined;
    }

    if (typeof data !== 'object') {
        return undefined;
    }

    if ('error' in data && typeof data.error === 'string') {
        return data.error;
    }

    if (
        'error' in data &&
        data.error &&
        typeof data.error === 'object' &&
        'message' in data.error &&
        typeof data.error.message === 'string'
    ) {
        return data.error.message;
    }

    if ('message' in data && typeof data.message === 'string') {
        return data.message;
    }

    return undefined;
}

function formatTitle(
    status?: number,
    statusText?: string,
    errorCode?: string,
    message?: string,
): string | undefined {
    if (status && statusText) {
        return `${status} ${statusText}`;
    }
    if (status) {
        return String(status);
    }
    if (errorCode && message) {
        return message;
    }
    return undefined;
}

function extractBasicProperties(error: Record<string, unknown>): Partial<ErrorDetails> {
    const result: Partial<ErrorDetails> = {};

    if (typeof error.status === 'number') {
        result.status = error.status;
    }

    if (typeof error.statusText === 'string') {
        result.statusText = error.statusText;
    }

    if (typeof error.code === 'string') {
        result.errorCode = error.code;
    }

    if ('data' in error) {
        const body = extractResponseBody(error.data);
        if (body) {
            result.responseBody = body;
        }

        const dataMsg = extractDataMessage(error.data);
        if (dataMsg) {
            result.dataMessage = dataMsg;
        }
    }

    const title = formatTitle(
        result.status,
        result.statusText,
        result.errorCode,
        typeof error.message === 'string' ? error.message : undefined,
    );
    if (title) {
        result.title = title;
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

    const details: ErrorDetails = {
        ...extractBasicProperties(error as Record<string, unknown>),
    };

    if ('headers' in error) {
        Object.assign(details, extractHeaders(error.headers));
    }

    if ('config' in error) {
        const {url, method} = extractConfig(error.config);
        if (url) {
            details.requestUrl = url;
        }
        if (method) {
            details.method = method;
        }
    }

    if (isResponseErrorWithIssues(error) && error.data) {
        details.hasIssues = true;
        details.issues = error.data.issues as IssueMessage[];
    }

    const hasAnyDetail = Object.keys(details).length > 0;
    return hasAnyDetail ? details : null;
}
