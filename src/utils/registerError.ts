export function registerError(error: Error, message?: string, type = 'error') {
    if (typeof window !== 'undefined' && window.Ya?.Rum) {
        window.Ya.Rum.logError(
            {
                additional: {
                    url: window.location.href,
                },
                type,
                message,
                level: window.Ya.Rum.ERROR_LEVEL.ERROR,
            },
            error,
        );
    } else {
        console.error(error);
    }
}
