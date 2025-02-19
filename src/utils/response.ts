import type {AxiosError, AxiosResponse} from 'axios';

import type {NetworkError} from '../types/api/error';

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

export function isAccessError(error: unknown): error is {status: number} {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'status' in error &&
            (error.status === 403 || error.status === 401),
    );
}

export function isRedirectToAuth(error: unknown): error is {status: 401; data: {authUrl: string}} {
    return Boolean(
        isAccessError(error) &&
            error.status === 401 &&
            'data' in error &&
            error.data &&
            typeof error.data === 'object' &&
            'authUrl' in error.data &&
            error.data.authUrl &&
            typeof error.data.authUrl === 'string',
    );
}
