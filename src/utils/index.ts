export const getArray = (arrayLength: number) => {
    return [...Array(arrayLength).keys()];
};

export function valueIsDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export async function wait(time: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
