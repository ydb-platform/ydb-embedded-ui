export const MIN_QUERY_NAME_LENGTH = 3;

export type QueryNameValidationError = 'not-empty' | 'min-length';

export function getQueryNameValidationError(value: string): QueryNameValidationError | undefined {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return 'not-empty';
    }

    if (normalizedValue.length < MIN_QUERY_NAME_LENGTH) {
        return 'min-length';
    }

    return undefined;
}
