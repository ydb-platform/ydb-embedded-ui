import {isNetworkError, isResponseError} from '../response';

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

    if (isResponseError(err)) {
        if (
            err.data &&
            typeof err.data === 'object' &&
            'message' in err.data &&
            typeof err.data.message === 'string'
        ) {
            return err.data.message;
        } else if (typeof err.data === 'string') {
            return err.data;
        }
    }

    if (err instanceof Error) {
        return err.message;
    }

    return JSON.stringify(err);
}
