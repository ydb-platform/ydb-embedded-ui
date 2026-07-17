import type {Location} from 'history';
import type {ParamSetup} from 'redux-location-state';

import {restoreUnknownParams} from '../restoreUnknownParams';

const PARAM_SETUP: ParamSetup = {
    global: {},
    '/database': {
        queryTab: {stateKey: 'tenant.queryTab'},
        diagnosticsTab: {stateKey: 'tenant.diagnosticsTab'},
    },
};

function createLocation(search: string): Location {
    return {
        pathname: '/database',
        search,
        hash: '',
        state: undefined,
        key: 'test',
    };
}

function getSearchParams(search: string) {
    return new URLSearchParams(search);
}

function restore(search: string, previousSearch: string) {
    return restoreUnknownParams(createLocation(search), createLocation(previousSearch), PARAM_SETUP)
        .search;
}

function expectNoIndexedParams(searchParams: URLSearchParams) {
    expect([...searchParams.keys()]).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/\[\d+\]$/)]),
    );
}

describe('restoreUnknownParams', () => {
    test('keeps only the last repeated value for known scalar parameters', () => {
        const search = restore('?queryTab=newQuery', '?database=old&database=current');
        const searchParams = getSearchParams(search);

        expect(searchParams.getAll('database')).toEqual(['current']);
    });

    test('canonicalizes indexed scalar parameters', () => {
        const search = restore(
            '?queryTab=newQuery',
            '?clusterName[0]=old-cluster&clusterName[1]=current-cluster&database[0]=old-db&database[1]=current-db',
        );
        const searchParams = getSearchParams(search);

        expect(searchParams.getAll('clusterName')).toEqual(['current-cluster']);
        expect(searchParams.getAll('database')).toEqual(['current-db']);
        expectNoIndexedParams(searchParams);
    });

    test('uses the last scalar from mixed direct and indexed values', () => {
        const search = restore(
            '?queryTab=newQuery',
            '?schema=old&schema[0]=intermediate&schema[1]=%2Fcurrent%2Ftable',
        );
        const searchParams = getSearchParams(search);

        expect(searchParams.getAll('schema')).toEqual(['/current/table']);
    });

    test('uses the highest numeric index when qs parses a value as an object', () => {
        const search = restore(
            '?queryTab=newQuery',
            '?database[21]=old-db&database[50]=current-db',
        );
        const searchParams = getSearchParams(search);

        expect(searchParams.getAll('database')).toEqual(['current-db']);
        expectNoIndexedParams(searchParams);
    });

    test('removes volatile parameters and keeps unlisted arrays repeated', () => {
        const search = restore(
            '?queryTab=newQuery',
            '?utm_referrer[0]=about%3Ablank&utm_referrer[1]=https%3A%2F%2Fexample.test&customFilter=one&customFilter=two',
        );
        const searchParams = getSearchParams(search);

        expect(searchParams.has('utm_referrer')).toBe(false);
        expect(searchParams.getAll('customFilter')).toEqual(['one', 'two']);
        expectNoIndexedParams(searchParams);
    });

    test('does not add a dangling delimiter when no unknown parameters remain', () => {
        expect(
            restore(
                '?queryTab=newQuery',
                '?queryTab=history&diagnosticsTab=overview&utm_referrer=about%3Ablank',
            ),
        ).toBe('?queryTab=newQuery');
    });

    test('is idempotent across repeated state transitions', () => {
        const generatedSearch = '?queryTab=newQuery&diagnosticsTab=overview';
        const firstSearch = restore(
            generatedSearch,
            '?database[0]=old-db&database[1]=current-db&schema[0]=old&schema[1]=%2Fcurrent%2Ftable',
        );
        const secondSearch = restore(generatedSearch, firstSearch);

        expect(secondSearch).toBe(firstSearch);
        expectNoIndexedParams(getSearchParams(secondSearch));
    });

    test('canonicalizes a sanitized production-style URL using its last valid schema', () => {
        const previousSearch =
            '?queryTab=newQuery&diagnosticsTab=overview&clusterName[0]=ru-central1-old&clusterName[1]=ru-central1&database[0]=old-db&database[1]=current-db&utm_referrer[0]=about%3Ablank&utm_referrer[1]=about%3Ablank&tenantPage[0]=query&tenantPage[1]=query&schema[0]=%2Fcurrent-db%2Ftablehttps%3A%2F%2Fydb.example.test%2Ftenant%3FqueryTab%3DnewQuery&schema[1]=%2Fcurrent-db%2Ftable&databasePage=query';
        const search = restore('?queryTab=newQuery&diagnosticsTab=schema', previousSearch);
        const searchParams = getSearchParams(search);

        expect(searchParams.getAll('clusterName')).toEqual(['ru-central1']);
        expect(searchParams.getAll('database')).toEqual(['current-db']);
        expect(searchParams.getAll('databasePage')).toEqual(['query']);
        expect(searchParams.getAll('tenantPage')).toEqual(['query']);
        expect(searchParams.getAll('schema')).toEqual(['/current-db/table']);
        expect(searchParams.has('utm_referrer')).toBe(false);
        expectNoIndexedParams(searchParams);
    });
});
