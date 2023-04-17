import type {AxiosError} from 'axios';

import type {IResponseError, NetworkError} from '../types/api/error';

export const isNetworkError = (
    error: NetworkError | IResponseError | AxiosError | unknown,
): error is NetworkError => {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'message' in error &&
            (error as {message: unknown}).message === 'Network Error',
    );
};
