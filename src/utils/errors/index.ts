import {isQueryErrorResponse} from '../query';
import {isNetworkError, isResponseError} from '../response';

import {extractDataMessage, extractErrorDetails} from './extractErrorDetails';
import i18n from './i18n';

export {extractErrorDetails} from './extractErrorDetails';
export type {ErrorDetails} from './extractErrorDetails';

/**
 * Prepares a consistent error message from various error types
 * @param err - The error object to process
 * @param defaultMessage - Optional fallback message used when a specific error message cannot be determined
 * @returns A formatted error message string
 */
export function prepareCommonErrorMessage(err: unknown, defaultMessage?: string): string {
    if (typeof err === 'string') {
        return err;
    }

    if (!err) {
        return i18n('unknown-error');
    }

    if (isNetworkError(err)) {
        return err.message;
    }

    if (isQueryErrorResponse(err)) {
        return err.error?.message || defaultMessage || i18n('unknown-error');
    }

    if (isResponseError(err)) {
        const dataMessage = extractDataMessage(err.data) ?? extractErrorDetails(err)?.dataMessage;
        if (err.status === 403) {
            return dataMessage || i18n('access-forbidden');
        }
        if (dataMessage) {
            return dataMessage;
        }
        if (err.statusText) {
            return err.statusText;
        }
    }

    if (err instanceof Error) {
        return err.message;
    }

    if (defaultMessage) {
        return defaultMessage;
    }

    return JSON.stringify(err);
}
