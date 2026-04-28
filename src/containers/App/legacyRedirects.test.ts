import {getLegacyClusterTenantsRedirect, getLegacyTenantRedirect} from './legacyRedirects';

describe('legacyRedirects', () => {
    describe('getLegacyClusterTenantsRedirect', () => {
        test('redirects legacy cluster tenants tab to databases and preserves URL parts', () => {
            expect(
                getLegacyClusterTenantsRedirect({
                    pathname: '/cluster/tenants',
                    search: '?clusterName=my-cluster&backend=http%3A%2F%2Flocalhost%3A8765',
                    hash: '#health',
                }),
            ).toEqual({
                pathname: '/cluster/databases',
                search: '?clusterName=my-cluster&backend=http%3A%2F%2Flocalhost%3A8765',
                hash: '#health',
            });
        });

        test('keeps the environment prefix when redirecting cluster tenants tab', () => {
            expect(
                getLegacyClusterTenantsRedirect({
                    pathname: '/cloud-prod/cluster/tenants',
                    search: '?clusterName=my-cluster',
                    hash: '',
                }),
            ).toEqual({
                pathname: '/cloud-prod/cluster/databases',
                search: '?clusterName=my-cluster',
                hash: '',
            });
        });
    });

    describe('getLegacyTenantRedirect', () => {
        test('redirects legacy tenant page to database and preserves URL parts', () => {
            expect(
                getLegacyTenantRedirect({
                    pathname: '/tenant',
                    search: '?schema=%2Flocal&database=%2Flocal&tenantPage=diagnostics',
                    hash: '#queries',
                }),
            ).toEqual({
                pathname: '/database',
                search: '?schema=%2Flocal&database=%2Flocal&tenantPage=diagnostics',
                hash: '#queries',
            });
        });

        test('keeps the environment prefix when redirecting tenant page', () => {
            expect(
                getLegacyTenantRedirect({
                    pathname: '/cloud-prod/tenant',
                    search: '?database=%2Fprod',
                    hash: '',
                }),
            ).toEqual({
                pathname: '/cloud-prod/database',
                search: '?database=%2Fprod',
                hash: '',
            });
        });
    });
});
