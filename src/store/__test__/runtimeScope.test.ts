import {getNextRuntimeScope} from '../runtimeScope';

describe('getNextRuntimeScope', () => {
    const clusterA = {environment: 'prod', clusterName: 'a', backend: '/a'};

    test('switching to another cluster or backend changes the scope', () => {
        expect(getNextRuntimeScope(clusterA, {...clusterA, clusterName: 'b'}).changed).toBe(true);
        expect(getNextRuntimeScope(clusterA, {...clusterA, backend: '/b'}).changed).toBe(true);
    });

    test('switching the environment changes the scope even for the same cluster', () => {
        expect(getNextRuntimeScope(clusterA, {...clusterA, environment: 'preprod'})).toEqual({
            scope: {...clusterA, environment: 'preprod'},
            changed: true,
        });
    });

    test('pages without a cluster keep the remembered cluster', () => {
        const clustersList = getNextRuntimeScope(clusterA, {environment: 'prod'});
        expect(clustersList).toEqual({scope: clusterA, changed: false});
        expect(getNextRuntimeScope(clustersList.scope, clusterA).changed).toBe(false);
        expect(
            getNextRuntimeScope(clustersList.scope, {...clusterA, clusterName: 'b'}).changed,
        ).toBe(true);
    });

    test('single cluster mode never changes the scope', () => {
        expect(getNextRuntimeScope({backend: '/'}, {backend: '/'}).changed).toBe(false);
        expect(getNextRuntimeScope({}, {}).changed).toBe(false);
    });
});
