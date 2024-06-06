import type {AxiosResponse} from 'axios';

import type {NetworkError} from '../types/api/error';

export const isNetworkError = (error: unknown): error is NetworkError => {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'message' in error &&
            error.message === 'Network Error',
    );
};

export const isAxiosResponse = (response: unknown): response is AxiosResponse => {
    return Boolean(response && typeof response === 'object' && 'status' in response);
};
