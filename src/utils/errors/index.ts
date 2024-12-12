import type {IResponseError} from '../../types/api/error';
import {isNetworkError} from '../response';

import i18n from './i18n';

/**
 * Prepares a consistent error message from various error types
 * @param err - The error object to process
 * @returns A formatted error message string
 */
export function prepareCommonErrorMessage(err: unknown): string {
    // Handle string errors
    if (typeof err === 'string') {
        return err;
    }

    // Handle null/undefined
    if (!err) {
        return i18n('unknown-error');
    }

    // Handle NetworkError
    if (isNetworkError(err)) {
        return err.message;
    }

    if (typeof err === 'object' && 'data' in err) {
        const responseError = err as IResponseError;
        if (responseError.data?.message) {
            return responseError.data.message;
        }
    }

    if (err instanceof Error) {
        return err.message;
    }

    return JSON.stringify(err);
}
