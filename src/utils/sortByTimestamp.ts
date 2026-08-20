export function sortByTimestampDescending<T>(
    items: readonly T[],
    getTimestamp: (item: T) => number | null | undefined,
): T[] {
    const sortedItems = items.toReversed();

    return sortedItems.sort((a, b) => {
        const aTimestamp = getTimestamp(a);
        const bTimestamp = getTimestamp(b);

        if (timestampIsDefined(aTimestamp) && timestampIsDefined(bTimestamp)) {
            return bTimestamp - aTimestamp;
        }
        if (timestampIsDefined(aTimestamp)) {
            return -1;
        }
        if (timestampIsDefined(bTimestamp)) {
            return 1;
        }
        return 0;
    });
}

function timestampIsDefined(value: number | null | undefined): value is number {
    return value !== null && value !== undefined;
}
