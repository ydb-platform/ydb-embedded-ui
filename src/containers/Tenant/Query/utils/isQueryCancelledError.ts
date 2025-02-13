import type {IResponseError} from '../../../../types/api/error';
import {isQueryErrorResponse, parseQueryError} from '../../../../utils/query';

function isAbortError(error: unknown): error is {name: string} {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
    );
}

function isResponseError(error: unknown): error is IResponseError {
    return typeof error === 'object' && error !== null && 'isCancelled' in error;
}

export function isQueryCancelledError(error: unknown): boolean {
    if (isAbortError(error)) {
        return true;
    }

    if (isResponseError(error) && error.isCancelled) {
        return true;
    }

    const parsedError = parseQueryError(error);
    return (
        isQueryErrorResponse(parsedError) && parsedError.error?.message === 'Query was cancelled'
    );
}
