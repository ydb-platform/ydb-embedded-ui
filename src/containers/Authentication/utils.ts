interface AuthError {
    data: {
        error: string;
    };
}

export function createSsoAuthorizeUrl(host: string, returnTo: string) {
    const url = new URL('/meta/oidc/authorize', `https://${host}`);
    url.searchParams.set('return_to', returnTo);

    return url.href;
}

interface GetSsoReturnToParams {
    currentUrl: URL;
    fallbackPath: string;
    isDirectAuthPage: boolean;
    returnUrl: unknown;
}

function isSafeLocalReturnTo(path: string) {
    return (
        path.startsWith('/') &&
        !path.startsWith('//') &&
        !path.includes('\\') &&
        !path.includes('\r') &&
        !path.includes('\n')
    );
}

export function getSsoReturnTo({
    currentUrl,
    fallbackPath,
    isDirectAuthPage,
    returnUrl,
}: GetSsoReturnToParams) {
    if (!isDirectAuthPage) {
        return `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    }

    if (typeof returnUrl !== 'string') {
        return fallbackPath;
    }

    try {
        const savedReturnUrl = new URL(decodeURIComponent(returnUrl));
        if (savedReturnUrl.origin !== currentUrl.origin) {
            return fallbackPath;
        }

        const path = `${savedReturnUrl.pathname}${savedReturnUrl.search}${savedReturnUrl.hash}`;
        return isSafeLocalReturnTo(path) ? path : fallbackPath;
    } catch {
        return fallbackPath;
    }
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
export function isDatabaseError(error: unknown): error is AuthError {
    return isAuthError(error) && error.data.error.includes('database');
}
