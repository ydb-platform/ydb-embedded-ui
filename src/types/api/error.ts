export interface IResponseError<T = unknown> {
    data?: T;
    status?: number;
    statusText?: string;
    isCancelled?: boolean;
}

// Error on offline backend or requests blocked by CORS
export interface NetworkError {
    code?: unknown;
    columnNumber?: unknown;
    config?: Record<string, unknown>;
    description?: unknown;
    fileName?: unknown;
    lineNumber?: unknown;
    message:
        | 'Network Error' // Axios
        | 'Failed to fetch' // Chrome/Edge
        | 'Load failed' // Safari
        | (string & {}); // Firefox and other variants
    name?: string;
    number?: unknown;
    stack?: string;
}

export type AuthErrorResponse = IResponseError<{
    error?: string;
}>;
