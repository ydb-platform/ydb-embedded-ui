interface ErrorWithRetry {
    retryPossible: boolean;
}

export const isErrorWithRetry = (error: unknown): error is ErrorWithRetry => {
    return Boolean(
        error && typeof error === 'object' && 'retryPossible' in error && error.retryPossible,
    );
};
