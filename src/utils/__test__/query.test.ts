import {isErrorResponse, isQueryErrorResponse} from '../query';

describe('isQueryErrorResponse', () => {
    test('should return true for object with error and issues', () => {
        const data = {
            error: {severity: 1, message: 'no viable alternative'},
            issues: [{severity: 1, message: 'no viable alternative'}],
            status: 'GENERIC_ERROR',
        };
        expect(isQueryErrorResponse(data)).toBe(true);
    });

    test('should return false for successful response without error/issues', () => {
        const data = {result: [{columns: [], rows: []}]};
        expect(isQueryErrorResponse(data)).toBe(false);
    });

    test('should return false for object with only issues (no error)', () => {
        const data = {issues: [{severity: 1, message: 'warning'}]};
        expect(isQueryErrorResponse(data)).toBe(false);
    });

    test('should return false for object with only error (no issues)', () => {
        const data = {error: {severity: 1, message: 'some error'}};
        expect(isQueryErrorResponse(data)).toBe(false);
    });

    test('should return false for null/undefined/string', () => {
        expect(isQueryErrorResponse(null)).toBe(false);
        expect(isQueryErrorResponse(undefined)).toBe(false);
        expect(isQueryErrorResponse('error string')).toBe(false);
    });
});

describe('isErrorResponse', () => {
    test('should return true for object with issues', () => {
        const data = {
            issues: [{severity: 1, message: 'Throughput limit exceeded'}],
            status: 'OVERLOADED',
        };
        expect(isErrorResponse(data)).toBe(true);
    });

    test('should return true for object with error and issues', () => {
        const data = {
            error: {severity: 1, message: 'error'},
            issues: [{severity: 1, message: 'error'}],
            status: 'GENERIC_ERROR',
        };
        expect(isErrorResponse(data)).toBe(true);
    });

    test('should return false for successful response', () => {
        const data = {result: [{columns: [], rows: []}]};
        expect(isErrorResponse(data)).toBe(false);
    });

    test('should return false for null/undefined/string', () => {
        expect(isErrorResponse(null)).toBe(false);
        expect(isErrorResponse(undefined)).toBe(false);
        expect(isErrorResponse('error')).toBe(false);
    });
});
