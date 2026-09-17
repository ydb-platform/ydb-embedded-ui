import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';

const TABLET_ID = '72075186224038476';

type TopShardsView = 'immediate' | 'history' | 'overview';

async function setupTopShardsMocks(page: Page, view: TopShardsView) {
    await page.route('**/viewer/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        switch (pathname) {
            case '/viewer/json/whoami':
                await route.fulfill({
                    json: {
                        UserSID: 'test-user',
                        IsDatabaseAllowed: true,
                        IsViewerAllowed: true,
                        IsMonitoringAllowed: true,
                    },
                });
                return;
            case '/viewer/capabilities':
                await route.fulfill({json: {Database: database, Capabilities: {}, Settings: {}}});
                return;
            case '/viewer/json/tenantinfo':
                await route.fulfill({
                    json: {TenantInfo: [{Name: database, Type: 'Serverless', Overall: 'Green'}]},
                });
                return;
            case '/viewer/json/describe':
                await route.fulfill({
                    json: {
                        Path: database,
                        PathDescription: {Self: {Name: 'local', PathType: 'EPathTypeSubDomain'}},
                    },
                });
                return;
            case '/viewer/json/query': {
                const {query} = route.request().postDataJSON();
                if (!/\.sys\/(partition_stats|top_partitions_)/.test(query)) {
                    await route.fulfill({json: {version: 8, result: []}});
                    return;
                }

                if (view === 'overview') {
                    expect(query).toContain('Path, TabletId, CPUCores, FollowerId');
                    expect(query).not.toMatch(/SELECT[\s\S]*\*/);
                } else {
                    expect(query).toMatch(/`\.sys\/(?:partition_stats|top_partitions_\w+)`\.\*/);
                }

                const columns = [
                    {name: 'TabletId', type: 'Uint64?'},
                    {name: 'RelativePath', type: 'Utf8?'},
                    {name: 'Path', type: 'Utf8?'},
                    {name: 'CPUCores', type: 'Double?'},
                ];
                const row = [TABLET_ID, 'test_table', `${database}/test_table`, 0.5];
                if (view !== 'overview') {
                    columns.push(
                        {name: 'DataSize', type: 'Uint64?'},
                        {name: 'NodeId', type: 'Uint32?'},
                        {name: 'InFlightTxCount', type: 'Uint32?'},
                        {name: 'PeakTime', type: 'Timestamp?'},
                        {name: 'IntervalEnd', type: 'Timestamp?'},
                    );
                    row.push('1024', 1, 0, '2026-01-01T12:00:00Z', '2026-01-01T12:01:00Z');
                }
                columns.push({name: 'FollowerId', type: 'Uint32?'});
                const rows = [0, '0', null, 5, '6'].map((followerId) => [...row, followerId]);
                await route.fulfill({json: {version: 8, result: [{columns, rows}]}});
                return;
            }
            default:
                await route.fulfill({json: {}});
        }
    });
}

for (const view of ['immediate', 'history', 'overview'] as const) {
    const query = {
        schema: database,
        database,
        databasePage: view === 'overview' ? 'database' : 'diagnostics',
        diagnosticsTab: view === 'overview' ? 'database' : 'topShards',
        shardsMode: view === 'overview' ? undefined : view,
        metricsTab: 'cpu',
    };

    test(`Top Shards marks followers and preserves tablet links in ${view}`, async ({page}) => {
        if (view === 'history') {
            await page.addInitScript(() => {
                localStorage.setItem('theme', 'dark');
                localStorage.setItem('topShardsColumnsWidth', JSON.stringify({TabletId: 220}));
            });
        }
        await setupTopShardsMocks(page, view);
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(query);
        await tenantPage.isDiagnosticsVisible();

        const rows = page.locator('tr.data-table__row').filter({hasText: TABLET_ID});
        await expect(rows).toHaveCount(5);
        await expect(rows.getByText(/^follower$/i)).toHaveCount(2);

        for (let index = 0; index < 3; index++) {
            const leader = rows.nth(index).getByRole('link', {name: TABLET_ID, exact: true});
            await expect(leader).toBeVisible();
            await expect(leader).not.toHaveAttribute('href', /followerId=/);
        }

        for (const followerId of [5, 6]) {
            const name = `${TABLET_ID}.${followerId}`;
            const link = page.getByRole('link', {name, exact: true});
            const row = rows.filter({has: link});
            const label = row.getByText(/^follower$/i);
            await expect(label).toBeVisible();
            const labelBounds = await label.boundingBox();
            const cellBounds = await row.locator('td').filter({has: link}).boundingBox();
            if (!labelBounds || !cellBounds) {
                throw new Error('The tablet cell and follower label must be visible');
            }
            expect(labelBounds.x + labelBounds.width).toBeLessThanOrEqual(
                cellBounds.x + cellBounds.width,
            );
            await expect(link).toHaveAttribute(
                'href',
                new RegExp(`followerId=${followerId}(?:&|$)`),
            );
        }

        const followerRow = rows.filter({hasText: `${TABLET_ID}.5`});
        await followerRow.hover();
        await followerRow.locator('.ydb-entity-name__clipboard-button').click();
        await expect
            .poll(() => page.evaluate(() => navigator.clipboard.readText()))
            .toBe(`${TABLET_ID}.5`);
    });
}
