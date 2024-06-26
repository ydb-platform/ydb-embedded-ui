interface GetUserOS {
    (): 'mac' | 'windows' | 'linux' | 'unknown' | string;
}

const getUserOS: GetUserOS = () => {
    if (!globalThis.navigator) {
        console.error(
            'Navigator is missing in globalThis! It seems the function has called from non-browser',
        );
    }

    const userAgent = globalThis.navigator.userAgent.toLowerCase();

    if (userAgent.includes('macintosh')) {
        return 'mac';
    }

    if (userAgent.includes('windows')) {
        return 'windows';
    }

    if (userAgent.includes('linux')) {
        return 'linux';
    }

    const [os] =
        userAgent
            .match(/\([.]+\)/)?.[0]
            .replaceAll(/\(\);/, '')
            .split('; ') || [];

    if (os) {
        return os.toLowerCase();
    }

    return 'unknown';
};

export const userOs = getUserOS();
