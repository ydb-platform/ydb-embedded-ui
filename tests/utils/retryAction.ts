export const retryAction = async <T>(
    action: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000,
): Promise<T> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await action();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max attempts reached');
};
