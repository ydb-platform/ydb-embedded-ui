import type {AxiosError} from 'axios';

import type {IResponseError, NetworkError} from '../types/api/error';
import type {ErrorResponse as QueryErrorResponse} from '../types/api/query';
import type {QueryError} from '../types/store/query';

type RequestError = NetworkError | IResponseError | AxiosError | QueryErrorResponse | unknown;

const isNetworkError = (error: RequestError): error is NetworkError => {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'message' in error &&
            (error as {message: unknown}).message === 'Network Error',
    );
};

export const parseQueryError = (error: QueryError): QueryErrorResponse | string | undefined => {
    if (isNetworkError(error)) {
        return error.message;
    }

    // 401 Unauthorized error is handled by GenericAPI
    return error ?? 'Unauthorized';
};
