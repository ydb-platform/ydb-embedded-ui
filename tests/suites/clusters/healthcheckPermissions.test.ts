import {expect} from '@playwright/test';

import {test} from '../../fixtures/multiCluster';

const cases = [
    {
        name: 'meta denies, cluster allows',
        emMetaAuth: true,
        metaAllowed: false,
        clusterAllowed: true,
        visible: false,
    },
    {
        name: 'meta allows, cluster denies',
        emMetaAuth: true,
        metaAllowed: true,
        clusterAllowed: false,
        visible: true,
    },
    {
        name: 'without EM authentication',
        emMetaAuth: false,
        metaAllowed: false,
        clusterAllowed: false,
        visible: true,
    },
];

for (const {name, emMetaAuth, metaAllowed, clusterAllowed, visible} of cases) {
    test(`cluster list healthcheck: ${name}`, async ({page, multiClusterUrl}) => {
        const identityRequests: string[] = [];
        const healthcheckRequests: string[] = [];
        await page.route(`${multiClusterUrl}/**`, async (route) => {
            const url = new URL(route.request().url());
            const pathname = url.pathname;
            if (!pathname.startsWith('/meta-api/') && !pathname.startsWith('/viewer/')) {
                await route.continue();
                return;
            }
            let json = {};
            if (pathname === '/meta-api/meta/whoami') {
                identityRequests.push('meta');
                json = {
                    UserSID: 'meta-user',
                    IsViewerAllowed: true,
                    IsMonitoringAllowed: metaAllowed,
                };
            } else if (pathname === '/viewer/json/whoami') {
                identityRequests.push('cluster');
                json = {
                    UserSID: 'cluster-user',
                    IsViewerAllowed: true,
                    IsMonitoringAllowed: clusterAllowed,
                };
            } else if (pathname === '/meta-api/meta/clusters') {
                json = {
                    clusters: [
                        {
                            name: 'test-cluster',
                            title: 'Test Cluster',
                            cluster: {Overall: 'Orange', overall_source: 'healthcheck'},
                        },
                    ],
                };
            } else if (pathname === '/meta-api/meta/cluster_health') {
                healthcheckRequests.push(url.searchParams.get('cluster_name') ?? '');
                json = {self_check_result: 'GOOD', issue_log: []};
            } else if (pathname.endsWith('/nodelist')) {
                json = [];
            }
            await route.fulfill({json});
        });

        await page.goto(`${multiClusterUrl}/home/clusters?emMetaAuth=${emMetaAuth ? '1' : '0'}`);
        const row = page.getByRole('row').filter({hasText: 'Test Cluster'});
        await expect(row).toBeVisible();
        await page.waitForLoadState('networkidle');
        expect(healthcheckRequests).toEqual([]);

        const badge = row.getByText('Caution', {exact: true});
        const button = row.locator('.ydb-clusters__status-button');
        const drawer = page.getByTestId('cluster-healthcheck-details');
        await expect(drawer).toBeHidden();
        if (visible) {
            await expect(badge).toBeVisible();
            await button.click();
            await expect(drawer).toBeVisible();
            await expect(drawer).toContainText('Everything is working fine');
            expect(healthcheckRequests).toEqual(['test-cluster']);
        } else {
            await expect(badge).toBeHidden();
            await expect(button).toHaveCount(0);
            await expect(drawer).toBeHidden();
            expect(healthcheckRequests).toEqual([]);
        }
        if (emMetaAuth) {
            expect(identityRequests).toEqual(['meta']);
        } else {
            expect(identityRequests).not.toContain('meta');
        }
    });
}
