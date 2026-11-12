import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TNodesInfo} from '../../../src/types/api/nodes';
import {DataIssuesAlert} from '../../models/DataIssuesAlert';
import {DataIssuesIndicator, LAST_IN_CONTROLS} from '../../models/DataIssuesIndicator';
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
        await expect(new DataIssuesIndicator(page).button).toHaveCount(0);
    });

    test('warns that the list of database nodes may be incomplete without Hive', async ({page}) => {
        const requests = await setupDataIssuesMocks(page, {
            nodes: () => createNodesResponse({Problems: ['hive-timeout', 'wb-incomplete']}),
        });
        await openDatabaseNodes(page);

        await expect(
            page.locator('table').getByText('storage-node-1', {exact: true}),
        ).toBeVisible();

        const indicator = new DataIssuesIndicator(page);
        await expect(indicator.button).toBeVisible();
        // The label is the last item of the controls row
        expect(await indicator.getPlaceInControls()).toEqual(LAST_IN_CONTROLS);
        await indicator.open();
        await expect(indicator.item('list-incomplete')).toBeVisible();
        await expect(indicator.item('nodes-status-unreliable')).toBeVisible();
        await expect(indicator.codes).toContainText('hive-timeout, wb-incomplete');
        expect(requests.at(-1)?.searchParams.get('database')).toBe('/local');
    });

    test('marks a node that did not answer in time and keeps the link to its page', async ({
        page,
    }) => {
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

        await expect(timedOutRow.getByTestId('node-state-unknown')).toBeVisible();
        await expect(table.getByTestId('node-state-unknown')).toHaveCount(1);

        await expect(
            timedOutRow.getByRole('link', {name: 'storage-node-2', exact: true}),
        ).toHaveAttribute('href', /\/node\/2\//);
        await expect(disconnectedRow.getByText('storage-node-3', {exact: true})).toBeVisible();
        await expect(disconnectedRow.getByRole('link')).toHaveCount(0);
    });

    test('warns over an empty list when database information is unavailable', async ({page}) => {
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

        const indicator = new DataIssuesIndicator(page);
        await indicator.open();
        await expect(indicator.item('database-unavailable')).toBeVisible();
    });

    test('shows the reason in place of the groups when grouping was not applied', async ({
        page,
    }) => {
        await setupDataIssuesMocks(page, {
            nodes: () => createNodesResponse({Nodes: [], NeedGroup: true}),
        });
        await openDatabaseNodes(page, {nodesGroupBy: 'Version'});

        // There are no groups to show, so the reason takes their place
        await expect(new DataIssuesAlert(page).item('group-not-applied')).toBeVisible();
        await expect(new DataIssuesIndicator(page).button).toBeVisible();
    });
});
