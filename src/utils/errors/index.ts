import {isNetworkError, isResponseError} from '../response';

export {extractErrorDetails} from './extractErrorDetails';
export type {ErrorDetails} from './extractErrorDetails';

import {extractMessageFromObject} from './extractErrorDetails';
import i18n from './i18n';

function extractResponseDataMessage(data: unknown): string | undefined {
    if (!data) {
        return undefined;
    }

    if (typeof data === 'string') {
        return data || undefined;
    }

    if (typeof data === 'object') {
        return extractMessageFromObject(data);
    }

    return undefined;
}

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

    if (isResponseError(err)) {
        const dataMessage = extractResponseDataMessage(err.data);
        if (dataMessage) {
            return dataMessage;
        }
        if (err.statusText) {
            return err.statusText;
        }
        if (err.status === 403) {
            return i18n('access-forbidden');
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
