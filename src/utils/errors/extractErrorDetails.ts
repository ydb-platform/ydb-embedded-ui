import type {IssueMessage} from '../../types/api/query';
import {isIssuesArray, isResponseErrorWithIssues} from '../response';

export interface ErrorDetails {
    status?: number;
    statusText?: string;
    /** Brief error title for display: "{status} {statusText}" or "Network Error" */
    title?: string;
    /** Raw error.message for diagnostics (shown when differs from title and dataMessage) */
    message?: string;
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
    /** Where the error occurred: 'connection' or 'stream' */
    errorPhase?: 'connection' | 'stream';
    /** Network state at the time of error */
    networkOnline?: boolean;
    networkEffectiveType?: string;
}

export const USEFUL_HEADERS = [
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

function hasStatus(error: Record<string, unknown>): boolean {
    return typeof error.status === 'number';
}

function hasStatusText(error: Record<string, unknown>): boolean {
    return typeof error.statusText === 'string';
}

function hasHeaders(error: Record<string, unknown>): boolean {
    return Boolean('headers' in error && error.headers && typeof error.headers === 'object');
}

function hasConfig(error: Record<string, unknown>): boolean {
    return Boolean('config' in error && error.config && typeof error.config === 'object');
}

function hasData(error: Record<string, unknown>): boolean {
    return 'data' in error && error.data !== undefined;
}

function normalizeErrorSource(error: Record<string, unknown>): Record<string, unknown> {
    if (!('response' in error) || !error.response || typeof error.response !== 'object') {
        return error;
    }

    const response = error.response as Record<string, unknown>;
    const normalized: Record<string, unknown> = {...error};
    if (
        !('message' in normalized) &&
        Object.prototype.hasOwnProperty.call(error, 'message') &&
        typeof error.message === 'string'
    ) {
        normalized.message = error.message;
    }
    if (!('name' in normalized) && 'name' in error && typeof error.name === 'string') {
        normalized.name = error.name;
    }

    if (!hasStatus(normalized) && hasStatus(response)) {
        normalized.status = response.status;
    }

    if (!hasStatusText(normalized) && hasStatusText(response)) {
        normalized.statusText = response.statusText;
    }

    if (!hasData(normalized) && hasData(response)) {
        normalized.data = response.data;
    }

    if (!hasHeaders(normalized) && hasHeaders(response)) {
        normalized.headers = response.headers;
    }

    if (!hasConfig(normalized) && hasConfig(response)) {
        normalized.config = response.config;
    }

    return normalized;
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
                const transformed = transform ? transform(value) : value;
                if (transformed) {
                    result[key] = transformed;
                }
            }
        }
    }

    return result;
}

function buildUrlWithParams(baseUrl: string, params: unknown): string {
    if (!params || typeof params !== 'object') {
        return baseUrl;
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    }

    const qs = searchParams.toString();
    if (!qs) {
        return baseUrl;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${qs}`;
}

function extractConfig(config: unknown): {url?: string; method?: string} {
    if (!config || typeof config !== 'object') {
        return {};
    }

    const result: {url?: string; method?: string} = {};

    if ('url' in config && typeof config.url === 'string') {
        const params = 'params' in config ? config.params : undefined;
        result.url = buildUrlWithParams(config.url, params);
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
            if (!json || json === '{}') {
                return undefined;
            }
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

function extractMessageFromObject(data: object): string | undefined {
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

    if ('code' in data && typeof data.code === 'string') {
        return data.code;
    }

    return undefined;
}

export function extractDataMessage(data: unknown): string | undefined {
    if (!data) {
        return undefined;
    }

    if (typeof data === 'string') {
        const trimmed = data.trim();
        return trimmed && isShortPlainText(trimmed) ? trimmed : undefined;
    }

    if (typeof data === 'object') {
        return extractMessageFromObject(data);
    }

    return undefined;
}

function formatTitle(
    status?: number,
    statusText?: string,
    errorCode?: string,
    message?: string,
): string | undefined {
    if (status !== undefined && statusText) {
        return `${status} ${statusText}`;
    }
    if (status !== undefined) {
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

function extractIssues(error: object): Partial<ErrorDetails> {
    if (isResponseErrorWithIssues(error) && error.data) {
        return {
            hasIssues: true,
            issues: error.data.issues as IssueMessage[],
        };
    }

    if ('issues' in error && isIssuesArray((error as Record<string, unknown>).issues)) {
        return {
            hasIssues: true,
            issues: (error as Record<string, unknown>).issues as IssueMessage[],
        };
    }

    return {};
}

function extractDiagnosticFields(error: object, existingFieldCount: number): Partial<ErrorDetails> {
    const result: Partial<ErrorDetails> = {};
    const errorRecord = error as Record<string, unknown>;

    // Save error.message for diagnostics, only when other useful fields exist
    if (typeof errorRecord.message === 'string' && errorRecord.message && existingFieldCount > 0) {
        result.message = errorRecord.message;
    }

    // Extract errorPhase from enriched streaming errors
    if ('errorPhase' in error && typeof errorRecord.errorPhase === 'string') {
        result.errorPhase = errorRecord.errorPhase as 'connection' | 'stream';
    }

    if ('networkOnline' in error && typeof errorRecord.networkOnline === 'boolean') {
        result.networkOnline = errorRecord.networkOnline;
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

    const normalizedError = normalizeErrorSource(error as Record<string, unknown>);
    const details: ErrorDetails = {
        ...extractBasicProperties(normalizedError),
    };

    // ErrorResponse has error.error.message at top level (not in .data)
    if (!details.dataMessage && 'error' in normalizedError) {
        const msg = extractDataMessage(normalizedError);
        if (msg) {
            details.dataMessage = msg;
        }
    }

    if ('headers' in normalizedError) {
        Object.assign(details, extractHeaders(normalizedError.headers));
    }

    if ('config' in normalizedError) {
        const {url, method} = extractConfig(normalizedError.config);
        if (url) {
            details.requestUrl = url;
        }
        if (method) {
            details.method = method;
        }
    }

    Object.assign(details, extractIssues(normalizedError));
    Object.assign(details, extractDiagnosticFields(normalizedError, Object.keys(details).length));

    const hasAnyDetail = Object.keys(details).length > 0;
    return hasAnyDetail ? details : null;
}
