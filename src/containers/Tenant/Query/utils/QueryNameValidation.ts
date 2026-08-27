export type QueryNameValidationError = 'not-empty';

export function getQueryNameValidationError(value: string): QueryNameValidationError | undefined {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return 'not-empty';
    }

    return undefined;
}
