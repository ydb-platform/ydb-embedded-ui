/* eslint-disable no-implicit-globals */
/**
 * Execute promises with limited concurrency
 */
export async function executeWithConcurrency<T, R>(
    items: T[],
    executor: (item: T) => Promise<R>,
    concurrency = 3,
): Promise<R[]> {
    if (items.length === 0) {
        return [];
    }

    if (concurrency <= 0) {
        throw new Error('Concurrency must be greater than 0');
    }

    const results: R[] = new Array(items.length);
    const executing: Promise<void>[] = [];
    let index = 0;

    const executeNext = async (): Promise<void> => {
        const currentIndex = index++;
        if (currentIndex >= items.length) {
            return;
        }

        const item = items[currentIndex];
        if (item === undefined) {
            return;
        }

        try {
            const result = await executor(item);
            results[currentIndex] = result;
        } catch (error) {
            // Store error as result - let caller handle it
            results[currentIndex] = error as R;
        }

        // Continue with next item
        await executeNext();
    };

    // Start initial batch of concurrent executions
    for (let i = 0; i < Math.min(concurrency, items.length); i++) {
        executing.push(executeNext());
    }

    // Wait for all executions to complete
    await Promise.all(executing);

    return results;
}

/**
 * Execute promises in batches with controlled concurrency
 */
export async function executeBatched<T, R>(
    items: T[],
    executor: (item: T) => Promise<R>,
    batchSize = 3,
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (item) => {
                try {
                    return await executor(item);
                } catch (error) {
                    return error as R;
                }
            }),
        );
        results.push(...batchResults);
    }

    return results;
}
