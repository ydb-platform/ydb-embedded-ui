export const getArray = (arrayLength: number) => {
    return [...Array(arrayLength).keys()];
};

export function valueIsDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export async function wait<T = unknown>(time: number, value?: T): Promise<T | undefined> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), time);
    });
}

export function normalizePathSlashes(path: string) {
    // Prevent multiple slashes when concatenating path parts
    // (?<!:) - negative lookbehind - ignore parts that start with :
    return path.replaceAll(/(?<!:)\/\/+/g, '/');
}

export function getSystemTheme() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
        return 'light';
    }
}

export function getTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'system') {
        return getSystemTheme();
    }

    return savedTheme.includes('dark') ? 'dark' : 'light';
}
