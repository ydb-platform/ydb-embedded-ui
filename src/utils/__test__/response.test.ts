import {isResponseError, isResponseErrorWithIssues} from '../response';

describe('isResponseError', () => {
    test('should return false on incorrect data', () => {
        const incorrectValues = [{}, [], 'hello', 123, null, undefined];

        incorrectValues.forEach((value) => {
            expect(isResponseError(value)).toBe(false);
        });
    });
    test('should return true if it is object with status or status text', () => {
        expect(isResponseError({status: 403})).toBe(true);
        expect(isResponseError({statusText: 'Gateway timeout'})).toBe(true);
    });
    test('should return true if it is cancelled', () => {
        expect(isResponseError({isCancelled: true})).toBe(true);
    });
    test('should return true if it has data', () => {
        expect(isResponseError({data: 'Everything is broken'})).toBe(true);
    });
});

describe('isResponseErrorWithIssues', () => {
    test('should return false on incorrect data', () => {
        const incorrectValues = [{}, [], 'hello', 123, null, undefined];

        incorrectValues.forEach((value) => {
            expect(isResponseErrorWithIssues({data: value})).toBe(false);
        });
    });
    test('should return false on empty issues', () => {
        expect(
            isResponseErrorWithIssues({
                data: {issues: []},
            }),
        ).toBe(false);
    });
    test('should return false on incorrect issues value', () => {
        const incorrectValues = [{}, [], 'hello', 123, null, undefined];

        incorrectValues.forEach((value) => {
            expect(isResponseErrorWithIssues({data: {issues: value}})).toBe(false);
        });
    });
    test('should return false on incorrect issue inside issues', () => {
        const incorrectValues = [{}, [], 'hello', 123, null, undefined];

        incorrectValues.forEach((value) => {
            expect(isResponseErrorWithIssues({data: {issues: [value]}})).toBe(false);
        });
    });
    test('should return true if it is an array of issues', () => {
        expect(
            isResponseErrorWithIssues({
                data: {issues: [{message: 'Some error'}]},
            }),
        ).toBe(true);
    });
});
