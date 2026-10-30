import {expect, test} from '@playwright/test';

import {backend} from '../../utils/constants';

for (const monitoringAllowed of [false, true, undefined]) {
    test(`cluster healthcheck permission: ${monitoringAllowed}`, async ({page}) => {
        const healthcheckRequests: string[] = [];
        await page.route(`${backend}/**`, async (route) => {
            const pathname = new URL(route.request().url()).pathname;
            let json = {};
            if (pathname.endsWith('/viewer/json/whoami')) {
                json = {
                    UserSID: 'cluster-healthcheck-user',
                    IsViewerAllowed: true,
                    IsMonitoringAllowed: monitoringAllowed,
                };
            } else if (pathname.endsWith('/viewer/capabilities')) {
                json = {
                    Capabilities: {'/viewer/cluster': 5},
                    Settings: {Cluster: {BridgeModeEnabled: true}},
                };
            } else if (pathname.endsWith('/viewer/json/cluster')) {
                json = {
                    Version: 6,
                    Domain: '/local',
                    Overall: 'Orange',
                    BridgeInfo: {Piles: [{PileId: 0, Name: 'pile-one', State: 'SYNCHRONIZED'}]},
                };
            } else if (pathname.endsWith('/viewer/json/healthcheck')) {
                healthcheckRequests.push(route.request().url());
                json = {self_check_result: 'GOOD', issue_log: []};
            } else if (pathname.endsWith('/viewer/json/nodelist')) {
                json = [];
            }
            await route.fulfill({json});
        });
        await page.goto(
            '/cluster/databases?showHealthcheck=1&view=storage&issuesFilter=old&healthcheckIssue=old&healthcheckLeaf=old',
        );
        await expect(page.locator('.ydb-cluster__header')).toBeVisible();
        await expect(page.getByText('pile-one', {exact: true})).toBeVisible();
        await page.waitForLoadState('networkidle');

        const statusButton = page
            .locator('.ydb-cluster__header')
            .getByRole('button', {includeHidden: true});
        const drawer = page.getByTestId('cluster-healthcheck-details');
        const pileHealthcheck = page.getByTestId('bridge-pile-healthcheck');
        const clusterStatus = page
            .locator('.ydb-cluster__header')
            .getByText('Caution', {exact: true});
        if (monitoringAllowed === false) {
            await expect(clusterStatus).toBeHidden();
            await expect(pileHealthcheck).toBeHidden();
            await expect(statusButton).toHaveCount(0);
            await expect(drawer).toBeHidden();
            await expect(page).toHaveURL((url) =>
                [
                    'showHealthcheck',
                    'view',
                    'issuesFilter',
                    'healthcheckIssue',
                    'healthcheckLeaf',
                ].every((param) => !url.searchParams.has(param)),
            );
            expect(healthcheckRequests).toEqual([]);
        } else {
            await expect(clusterStatus).toBeVisible();
            await expect(pileHealthcheck).toBeVisible();
            await expect(statusButton).toBeVisible();
            await expect(drawer).toBeVisible();
            expect(healthcheckRequests.length).toBeGreaterThan(0);
            await expect(page).toHaveURL((url) => url.searchParams.get('showHealthcheck') === '1');
        }
    });
}
