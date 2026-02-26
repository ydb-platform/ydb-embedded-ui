import {isQueryErrorResponse, parseQueryError} from '../../../../utils/query';
import {isAbortError, isResponseError} from '../../../../utils/response';

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
