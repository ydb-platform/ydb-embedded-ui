export function prepareErrorMessage(error: unknown) {
    if (error && typeof error === 'string') {
        return error;
    }

    if (error && typeof error === 'object') {
        if ('data' in error && typeof error.data === 'string') {
            return error.data;
        } else if ('statusText' in error && typeof error.statusText === 'string') {
            return error.statusText;
        } else if ('message' in error && typeof error.message === 'string') {
            return error.message;
        }
    }

    return '';
}
