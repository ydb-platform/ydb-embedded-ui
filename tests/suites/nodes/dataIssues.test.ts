import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TNodesInfo} from '../../../src/types/api/nodes';
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

    test('marks a node that did not answer in time and keeps the link to its page', async ({
        page,
    }, testInfo) => {
        await setupDataIssuesMocks(page, {
            nodes: () =>
                createNodesResponse({
                    TotalNodes: '3',
                    FoundNodes: '3',
                    Nodes: [
                        {NodeId: 1, SystemState: {Host: 'storage-node-1', SystemState: 'Green'}},
                        // Reported as disconnected only because it did not answer in time
                        {
                            NodeId: 2,
                            Disconnected: true,
                            ResponseTimeout: true,
                            SystemState: {Host: 'storage-node-2'},
                        },
                        // Really disconnected
                        {NodeId: 3, Disconnected: true, SystemState: {Host: 'storage-node-3'}},
                    ] as TNodesInfo['Nodes'],
                    Problems: ['wb-incomplete'],
                }),
        });
        await openDatabaseNodes(page);

        const table = page.locator('table');
        const timedOutRow = table.locator('tr', {hasText: 'storage-node-2'});
        const disconnectedRow = table.locator('tr', {hasText: 'storage-node-3'});

        const stateUnknownIcon = timedOutRow.getByTestId('node-state-unknown');
        await expect(stateUnknownIcon).toBeVisible();
        await expect(table.getByTestId('node-state-unknown')).toHaveCount(1);

        await stateUnknownIcon.hover();
        await expect(
            page.getByText('The node did not respond in time. Its state is unknown.'),
        ).toBeVisible();
        await page.screenshot({path: testInfo.outputPath('node-response-timeout.png')});

        await expect(
            timedOutRow.getByRole('link', {name: 'storage-node-2', exact: true}),
        ).toHaveAttribute('href', /\/node\/2\//);
        await expect(disconnectedRow.getByText('storage-node-3', {exact: true})).toBeVisible();
        await expect(disconnectedRow.getByRole('link')).toHaveCount(0);
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
