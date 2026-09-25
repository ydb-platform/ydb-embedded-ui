import {getAuthReturnTo} from '../utils';

describe('getAuthReturnTo', () => {
    const currentUrl = new URL('https://trusted-host/ui/auth');
    const fallbackPath = '/ui/cluster';

    test('preserves basename, runtime parameters and hash in the saved URL', () => {
        expect(
            getAuthReturnTo({
                currentUrl,
                fallbackPath,
                isDirectAuthPage: true,
                returnUrl: encodeURIComponent(
                    'https://trusted-host/ui/production/database?database=%2Flocal&schema=%2Flocal%2Ftable&clusterName=cluster-a&backend=node-a#query',
                ),
            }),
        ).toBe(
            '/ui/production/database?database=%2Flocal&schema=%2Flocal%2Ftable&clusterName=cluster-a&backend=node-a#query',
        );
    });

    test('returns the current page for inline authentication', () => {
        expect(
            getAuthReturnTo({
                currentUrl: new URL('https://trusted-host/ui/database?database=%2Flocal#query'),
                fallbackPath,
                isDirectAuthPage: false,
                returnUrl: encodeURIComponent('https://trusted-host/ui/cluster'),
            }),
        ).toBe('/ui/database?database=%2Flocal#query');
    });

    test.each([
        undefined,
        '',
        ['https://trusted-host/ui/cluster'],
        {path: '/ui/cluster'},
        '%invalid',
        encodeURIComponent('https://other-host/ui/cluster'),
        encodeURIComponent('https://trusted-host//other-host'),
    ])('falls back for an invalid return URL: %j', (returnUrl) => {
        expect(getAuthReturnTo({currentUrl, fallbackPath, isDirectAuthPage: true, returnUrl})).toBe(
            fallbackPath,
        );
    });

    test('falls back when the implicit current path is not a safe local path', () => {
        expect(
            getAuthReturnTo({
                currentUrl: new URL('https://trusted-host//attacker.example'),
                fallbackPath,
                isDirectAuthPage: false,
                returnUrl: undefined,
            }),
        ).toBe('/ui/cluster');
    });
});
