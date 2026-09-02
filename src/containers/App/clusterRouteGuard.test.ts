import {shouldRedirectClusterRouteToRoot} from './clusterRouteGuard';

describe('shouldRedirectClusterRouteToRoot', () => {
    test.each([
        {
            name: 'redirects a multi-cluster route without clusterName',
            singleClusterMode: false,
            pathname: '/cluster/databases',
            search: '?databasePage=query',
            expected: true,
        },
        {
            name: 'redirects a multi-cluster route with an empty clusterName',
            singleClusterMode: false,
            pathname: '/cluster',
            search: '?clusterName=',
            expected: true,
        },
        {
            name: 'keeps a multi-cluster route with clusterName',
            singleClusterMode: false,
            pathname: '/cluster/databases',
            search: '?clusterName=my-cluster',
            expected: false,
        },
        {
            name: 'keeps a single-cluster route without clusterName',
            singleClusterMode: true,
            pathname: '/cluster/databases',
            search: '',
            expected: false,
        },
        {
            name: 'keeps a non-cluster route without clusterName',
            singleClusterMode: false,
            pathname: '/database',
            search: '?databasePage=query',
            expected: false,
        },
    ])('$name', ({singleClusterMode, pathname, search, expected}) => {
        expect(shouldRedirectClusterRouteToRoot({singleClusterMode, pathname, search})).toBe(
            expected,
        );
    });
});
