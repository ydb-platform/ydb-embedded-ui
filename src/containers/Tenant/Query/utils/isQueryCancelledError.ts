import {parseQueryError} from '../../../../utils/query';

export function isQueryCancelledError(error: unknown) {
    const parsedError = parseQueryError(error);
    return typeof parsedError === 'object' && parsedError.error?.message === 'Query was cancelled';
}
