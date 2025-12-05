/** Serialize the error to make it Redux-compatible */
export function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {message: error.message, name: error.name};
    }
    return error;
}
