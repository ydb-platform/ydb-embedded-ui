import type {IResponseError} from '../../../../types/api/error';
import {parseQueryError} from '../../../../utils/query';

export function isQueryCancelledError(error: unknown) {
    const parsedError = parseQueryError(error);

    return (
        (typeof error === 'object' &&
            ((error as IResponseError)?.isCancelled ||
                (error as {name: string}).name === 'AbortError')) ||
        (typeof parsedError === 'object' && parsedError.error?.message === 'Query was cancelled')
    );
}
