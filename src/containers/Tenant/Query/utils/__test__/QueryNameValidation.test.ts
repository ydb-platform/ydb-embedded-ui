import {getQueryNameValidationError} from '../QueryNameValidation';

test('accepts a single-character query name', () => {
    expect(getQueryNameValidationError('a')).toBeUndefined();
});

test('rejects a whitespace-only query name', () => {
    expect(getQueryNameValidationError(' \t\n')).toBe('not-empty');
});
