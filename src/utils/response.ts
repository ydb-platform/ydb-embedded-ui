import type {AxiosError, AxiosResponse} from 'axios';

import type {IResponseError, NetworkError} from '../types/api/error';
import type {TIssueMessage} from '../types/api/operations';
import type {IssueMessage} from '../types/api/query';

export function isResponseError(error: unknown): error is IResponseError {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const hasData = 'data' in error;
    const hasStatus = 'status' in error && typeof error.status === 'number';
    const hasStatusText = 'statusText' in error && typeof error.statusText === 'string';
    const isCancelled = 'isCancelled' in error && typeof error.isCancelled === 'boolean';

    return hasData || hasStatus || hasStatusText || isCancelled;
}

export const isNetworkError = (error: unknown): error is NetworkError => {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string' &&
            error.message.toLowerCase() === 'network error',
    );
};

export const isAxiosResponse = (response: unknown): response is AxiosResponse => {
    return Boolean(response && typeof response === 'object' && 'status' in response);
};

type AxiosErrorObject = {
    [K in keyof AxiosError]: AxiosError[K] extends Function ? never : AxiosError[K];
};

export function isAxiosError(error: unknown): error is AxiosErrorObject {
    return Boolean(
        error && typeof error === 'object' && 'name' in error && error.name === 'AxiosError',
    );
}

export function isAccessError(error: unknown): error is IResponseError {
    return Boolean(isResponseError(error) && (error.status === 403 || error.status === 401));
}

export function isRedirectToAuth(error: unknown): error is {status: 401; data: {authUrl: string}} {
    return Boolean(
        isAccessError(error) &&
            error.status === 401 &&
            error.data &&
            typeof error.data === 'object' &&
            'authUrl' in error.data &&
            error.data.authUrl &&
            typeof error.data.authUrl === 'string',
    );
}

type Issue = TIssueMessage | IssueMessage;

export function isResponseErrorWithIssues(
    error: unknown,
): error is IResponseError<{issues: Issue[]}> {
    return Boolean(
        isResponseError(error) &&
            error.data &&
            typeof error.data === 'object' &&
            'issues' in error.data &&
            isIssuesArray(error.data.issues),
    );
}

export function isIssuesArray(arr: unknown): arr is Issue[] {
    return Boolean(Array.isArray(arr) && arr.length && arr.every(isIssue));
}

export function isIssue(obj: unknown): obj is Issue {
    return Boolean(
        obj && typeof obj === 'object' && 'message' in obj && typeof obj.message === 'string',
    );
}
