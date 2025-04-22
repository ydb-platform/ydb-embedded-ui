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
