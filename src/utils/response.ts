import type {AxiosError, AxiosResponse} from 'axios';

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

type AxiosErrorObject = {
    [K in keyof AxiosError]: AxiosError[K] extends Function ? never : AxiosError[K];
};

export function isAxiosError(error: unknown): error is AxiosErrorObject {
    return Boolean(
        error && typeof error === 'object' && 'name' in error && error.name === 'AxiosError',
    );
}
