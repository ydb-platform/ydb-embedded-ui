interface AuthError {
    data: {
        error: string;
    };
}

function isAuthError(error: unknown): error is AuthError {
    return Boolean(
        error &&
            typeof error === 'object' &&
            'data' in error &&
            error.data &&
            typeof error.data === 'object' &&
            'error' in error.data &&
            typeof error.data.error === 'string',
    );
}

export function isUserError(error: unknown): error is AuthError {
    return isAuthError(error) && error.data.error.includes('user');
}
export function isPasswordError(error: unknown): error is AuthError {
    return isAuthError(error) && error.data.error.includes('password');
}
