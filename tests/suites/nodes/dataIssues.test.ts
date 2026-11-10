import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {DataIssuesAlert} from '../../models/DataIssuesAlert';
import {PageModel} from '../../models/PageModel';
import {createNodesResponse, setupDataIssuesMocks} from '../storage/dataIssuesMocks';

/** Opens the Nodes tab of the database and waits for the response the table is built from */
async function openDatabaseNodes(page: Page, query: Record<string, string> = {}) {
    const nodesResponse = page.waitForResponse(
        (response) => response.url().includes('/viewer/json/nodes?') && response.ok(),
    );
    await new PageModel(page, 'database', {
        database: '/local',
        schema: '/local',
        databasePage: 'diagnostics',
        diagnosticsTab: 'nodes',
    }).goto(query);
    await nodesResponse;
}

test.describe('Database nodes data issues', () => {
    test('shows no warning when the handler reports no problems', async ({page}) => {
        await setupDataIssuesMocks(page, {});
        await openDatabaseNodes(page);

        await expect(
            page.locator('table').getByText('storage-node-1', {exact: true}),
        ).toBeVisible();
        await expect(new DataIssuesAlert(page).selector).toHaveCount(0);
    });

    test('warns that the list of database nodes may be incomplete without Hive', async ({
        page,
    }, testInfo) => {
        const requests = await setupDataIssuesMocks(page, {
            nodes: () => createNodesResponse({Problems: ['hive-timeout', 'wb-incomplete']}),
        });
        await openDatabaseNodes(page);

        await expect(
            page.locator('table').getByText('storage-node-1', {exact: true}),
        ).toBeVisible();

        const alert = new DataIssuesAlert(page);
        await expect(alert.item('list-incomplete')).toHaveText(
            'The list may be incomplete: some data sources did not respond.',
        );
        await expect(alert.item('nodes-status-unreliable')).toBeVisible();
        await expect(alert.codes).toHaveText(
            'Problems reported by the server: hive-timeout, wb-incomplete',
        );
        expect(requests.at(-1)?.searchParams.get('database')).toBe('/local');

        await page.screenshot({path: testInfo.outputPath('database-nodes-data-issues.png')});
    });

    test('explains an empty list when database information is unavailable', async ({page}) => {
        await setupDataIssuesMocks(page, {
            // The handler clears the list in this case
            nodes: () => ({
                TotalNodes: '0',
                FoundNodes: '0',
                Nodes: [],
                Problems: ['no-database-info'],
            }),
        });
        await openDatabaseNodes(page);

        await expect(new DataIssuesAlert(page).item('database-unavailable')).toHaveText(
            'Database information is unavailable, so its nodes cannot be listed.',
        );
        await expect(
            page.getByText('Nothing to show, but the data may be incomplete'),
        ).toBeVisible();
    });

    test('warns that grouping was not applied instead of saying there are no groups', async ({
        page,
    }) => {
        await setupDataIssuesMocks(page, {
            nodes: () => createNodesResponse({Nodes: [], NeedGroup: true}),
        });
        await openDatabaseNodes(page, {nodesGroupBy: 'Version'});

        await expect(new DataIssuesAlert(page).item('group-not-applied')).toHaveText(
            'Grouping was not applied.',
        );
        await expect(page.getByText('No nodes groups')).toHaveCount(0);
    });
});
