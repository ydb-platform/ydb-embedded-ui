import {
    isAccessError,
    isNetworkError,
    isRedirectToAuth,
    isResponseError,
    isResponseErrorWithIssues,
} from '../response';

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

describe('isNetworkError', () => {
    test('should return false for non-objects', () => {
        expect(isNetworkError(null)).toBe(false);
        expect(isNetworkError(undefined)).toBe(false);
        expect(isNetworkError('Network Error')).toBe(false);
        expect(isNetworkError(42)).toBe(false);
    });
    test('should return true for message "Network Error"', () => {
        expect(isNetworkError({message: 'Network Error'})).toBe(true);
    });
    test('should return true case-insensitively', () => {
        expect(isNetworkError({message: 'network error'})).toBe(true);
        expect(isNetworkError({message: 'NETWORK ERROR'})).toBe(true);
    });
    test('should return false for other error messages', () => {
        expect(isNetworkError({message: 'timeout of 600000ms exceeded'})).toBe(false);
        expect(isNetworkError({message: 'Request failed'})).toBe(false);
    });
});

describe('isAccessError', () => {
    test('should return true for status 401', () => {
        expect(isAccessError({status: 401})).toBe(true);
    });
    test('should return true for status 403', () => {
        expect(isAccessError({status: 403})).toBe(true);
    });
    test('should return false for other statuses', () => {
        expect(isAccessError({status: 500})).toBe(false);
        expect(isAccessError({status: 429})).toBe(false);
        expect(isAccessError({status: 200})).toBe(false);
    });
    test('should return false for non-objects', () => {
        expect(isAccessError(null)).toBe(false);
        expect(isAccessError(undefined)).toBe(false);
        expect(isAccessError('forbidden')).toBe(false);
    });
});

describe('isRedirectToAuth', () => {
    test('should return true for 401 with authUrl', () => {
        expect(
            isRedirectToAuth({status: 401, data: {authUrl: 'https://auth.example.com/login'}}),
        ).toBe(true);
    });
    test('should return false for 401 without authUrl', () => {
        expect(isRedirectToAuth({status: 401, data: {code: 'NEED_RESET'}})).toBe(false);
    });
    test('should return false for 401 with empty authUrl', () => {
        expect(isRedirectToAuth({status: 401, data: {authUrl: ''}})).toBe(false);
    });
    test('should return false for 403 with authUrl', () => {
        expect(
            isRedirectToAuth({status: 403, data: {authUrl: 'https://auth.example.com/login'}}),
        ).toBe(false);
    });
    test('should return false for 401 without data', () => {
        expect(isRedirectToAuth({status: 401})).toBe(false);
    });
});
