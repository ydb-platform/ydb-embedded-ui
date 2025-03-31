import {isQueryErrorResponse, parseQueryError} from '../../../../utils/query';
import {isResponseError} from '../../../../utils/response';

function isAbortError(error: unknown): error is {name: string} {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
    );
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
