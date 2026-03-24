import {getInvalidClusterRedirectPath, isInvalidClusterRouteState} from '../invalidClusterRedirect';

describe('isInvalidClusterRouteState', () => {
    test('returns true for cluster not found response body', () => {
        expect(
            isInvalidClusterRouteState({
                currentData: undefined,
                error: {status: 400, data: 'Cluster not found'},
                isSuccess: false,
            }),
        ).toBe(true);
    });

    test('returns false for successful empty cluster resolve', () => {
        expect(
            isInvalidClusterRouteState({
                currentData: undefined,
                error: undefined,
                isSuccess: true,
            }),
        ).toBe(false);
    });

    test('returns false for non-invalid errors', () => {
        expect(
            isInvalidClusterRouteState({
                currentData: undefined,
                error: {status: 400, data: 'Unexpected error'},
                isSuccess: false,
            }),
        ).toBe(false);
    });

    test('returns false when valid cluster data exists', () => {
        expect(
            isInvalidClusterRouteState({
                currentData: {name: 'valid-cluster'},
                error: undefined,
                isSuccess: true,
            }),
        ).toBe(false);
    });
});

describe('getInvalidClusterRedirectPath', () => {
    test('returns databases home path without broken cluster params', () => {
        const path = getInvalidClusterRedirectPath(true);

        expect(path).toContain('/home/databases');
        expect(path).not.toContain('clusterName=');
        expect(path).not.toContain('backend=');
    });

    test('returns clusters home path without broken cluster params', () => {
        const path = getInvalidClusterRedirectPath(false);

        expect(path).toContain('/home/clusters');
        expect(path).not.toContain('clusterName=');
        expect(path).not.toContain('backend=');
    });
});
