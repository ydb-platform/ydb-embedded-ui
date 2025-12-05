/**
 * Serialize the error to make it Redux-compatible
 *
 * It prevents redux console error on string error in code - `throw new Error("description")`
 */
export function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {message: error.message, name: error.name};
    }
    return error;
}
