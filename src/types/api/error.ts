export interface IResponseErrorMeta {
    traceId?: string;
    requestUrl?: string;
    method?: string;
    errorCode?: string;
}

export interface IResponseError<T = unknown> {
    data?: T;
    status?: number;
    statusText?: string;
    isCancelled?: boolean;
    _meta?: IResponseErrorMeta;
}

// Error on offline backend or requests blocked by CORS
export interface NetworkError {
    code?: unknown;
    columnNumber?: unknown;
    config?: Record<string, unknown>;
    description?: unknown;
    fileName?: unknown;
    lineNumber?: unknown;
    message: 'Network Error';
    name?: string;
    number?: unknown;
    stack?: string;
}

export type AuthErrorResponse = IResponseError<{
    error?: string;
}>;
