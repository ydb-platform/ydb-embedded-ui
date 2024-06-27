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

const userOs = getUserOS();

const isMacintosh = userOs === 'mac';

export const CtrlCmd = isMacintosh ? 'META' : 'CTRL';

function formatSpecialKey(key: string) {
    switch (key) {
        case 'META': {
            return '⌘';
        }
        case 'Alt': {
            return isMacintosh ? '⌥' : 'Alt';
        }
        case 'CTRL':
        case 'Control': {
            return isMacintosh ? '⌃' : 'Ctrl';
        }
        case 'Shift': {
            return isMacintosh ? '⇧' : 'Shift';
        }
        default: {
            return key;
        }
    }
}

const special = ['⌘', '⌥', '⇧', '⌃'];
export function formatShortcut(keys: string[]) {
    let mapped = keys.map((key) => formatSpecialKey(key));

    function getWeight(a: string) {
        const specialIndex = special.indexOf(a);
        if (specialIndex !== -1) {
            return specialIndex * -1;
        }
        return mapped.indexOf(a);
    }

    if (isMacintosh) {
        mapped = [...mapped].sort((a, b) => getWeight(a) - getWeight(b));
    }

    return mapped.join(isMacintosh ? '' : ' + ');
}
