import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {DataIssuesAlert} from '../../models/DataIssuesAlert';

import {StoragePage} from './StoragePage';
import {
    DATA_ISSUES_GROUP_ID,
    createGroupsResponse,
    createNodesResponse,
    setupDataIssuesMocks,
} from './dataIssuesMocks';

type StorageQuery = {type: 'groups' | 'nodes'} & Record<string, string>;

function waitForTableResponse(page: Page, type: StorageQuery['type']) {
    const path = type === 'nodes' ? '/viewer/json/nodes?' : '/storage/groups?';

    return page.waitForResponse((response) => response.url().includes(path) && response.ok());
}

/** Opens the Storage page and waits for the response the table is built from */
async function openStoragePage(page: Page, query: StorageQuery) {
    const storagePage = new StoragePage(page);
    const tableResponse = waitForTableResponse(page, query.type);
    await storagePage.goto(query);
    await tableResponse;

    return storagePage;
}

test.describe('Storage groups data issues', () => {
    test('shows no warning when the handler reports no problems', async ({page}) => {
        await setupDataIssuesMocks(page, {});
        const storagePage = await openStoragePage(page, {type: 'groups'});

        await expect(storagePage.getGroupRow(DATA_ISSUES_GROUP_ID)).toBeVisible();
        await expect(new DataIssuesAlert(page).selector).toHaveCount(0);
    });

    test('warns that the list may be incomplete and names the problems', async ({
        page,
    }, testInfo) => {
        await setupDataIssuesMocks(page, {
            groups: () =>
                createGroupsResponse({
                    Problems: ['bsc-timeout', 'wb-incomplete-groups', 'bsc-pdisks-no-data'],
                }),
        });
        const storagePage = await openStoragePage(page, {type: 'groups'});

        // The rows the handler could collect are still shown
        await expect(storagePage.getGroupRow(DATA_ISSUES_GROUP_ID)).toBeVisible();

        const alert = new DataIssuesAlert(page);
        await expect(alert.selector).toBeVisible();
        await expect(alert.item('list-incomplete')).toHaveText(
            'The list may be incomplete: some data sources did not respond.',
        );
        await expect(alert.item('partial-data')).toBeVisible();
        await expect(alert.items).toHaveCount(2);
        await expect(alert.codes).toHaveText(
            'Problems reported by the server: bsc-timeout, wb-incomplete-groups, bsc-pdisks-no-data',
        );

        await page.screenshot({path: testInfo.outputPath('storage-groups-data-issues.png')});
    });

    test('warns that sorting was not applied', async ({page}) => {
        await setupDataIssuesMocks(page, {
            groups: () => createGroupsResponse({Problems: ['bsc-error'], NeedSort: true}),
        });
        await openStoragePage(page, {type: 'groups'});

        const alert = new DataIssuesAlert(page);
        await expect(alert.item('sort-not-applied')).toHaveText(
            'Sorting was not applied: rows are shown in arbitrary order.',
        );
    });

    test('removes the warning when the next response has no problems', async ({page}) => {
        let broken = true;
        await setupDataIssuesMocks(page, {
            groups: () => createGroupsResponse(broken ? {Problems: ['bsc-timeout']} : {}),
        });
        const storagePage = await openStoragePage(page, {type: 'groups'});

        const alert = new DataIssuesAlert(page);
        await expect(alert.item('list-incomplete')).toBeVisible();

        broken = false;
        const tableResponse = waitForTableResponse(page, 'groups');
        await page.reload();
        await tableResponse;

        await expect(storagePage.getGroupRow(DATA_ISSUES_GROUP_ID)).toBeVisible();
        await expect(alert.selector).toHaveCount(0);
    });

    test('does not claim there are no degraded groups while the list may be incomplete', async ({
        page,
    }) => {
        await setupDataIssuesMocks(page, {
            groups: () =>
                createGroupsResponse({
                    TotalGroups: 1,
                    FoundGroups: 0,
                    StorageGroups: [],
                    Problems: ['bsc-timeout'],
                }),
        });
        await openStoragePage(page, {type: 'groups', visible: 'missing'});

        await expect(new DataIssuesAlert(page).item('list-incomplete')).toBeVisible();
        await expect(
            page.getByText('Nothing to show, but the data may be incomplete'),
        ).toBeVisible();
        await expect(page.getByText('No degraded groups')).toHaveCount(0);
    });

    test('warns that grouping was not applied instead of saying there are no groups', async ({
        page,
    }, testInfo) => {
        await setupDataIssuesMocks(page, {
            // Without BS controller the handler returns a plain list instead of groups
            groups: () =>
                createGroupsResponse({
                    Problems: ['bsc-timeout', 'bsc-storage-pools-no-data'],
                    NeedGroup: true,
                }),
        });
        await openStoragePage(page, {
            type: 'groups',
            storageGroupsGroupBy: 'MediaType',
        });

        const alert = new DataIssuesAlert(page);
        await expect(alert.item('group-not-applied')).toHaveText('Grouping was not applied.');
        await expect(alert.item('list-incomplete')).toBeVisible();
        await expect(page.getByText('No such groups')).toHaveCount(0);

        await page.screenshot({path: testInfo.outputPath('storage-groups-grouping-issue.png')});
    });
});

test.describe('Storage nodes data issues', () => {
    test('shows no warning when the handler reports no problems', async ({page}) => {
        await setupDataIssuesMocks(page, {});
        const storagePage = await openStoragePage(page, {type: 'nodes'});

        await expect(storagePage.table.getByText('storage-node-1', {exact: true})).toBeVisible();
        await expect(new DataIssuesAlert(page).selector).toHaveCount(0);
    });

    test('warns about disks of unavailable nodes and nodes that did not answer in time', async ({
        page,
    }, testInfo) => {
        await setupDataIssuesMocks(page, {
            nodes: () =>
                createNodesResponse({
                    Problems: ['bsc-timeout', 'bsc-pdisks-no-data', 'wb-incomplete'],
                }),
        });
        const storagePage = await openStoragePage(page, {type: 'nodes'});

        await expect(storagePage.table.getByText('storage-node-1', {exact: true})).toBeVisible();

        const alert = new DataIssuesAlert(page);
        await expect(alert.item('nodes-status-unreliable')).toHaveText(
            'Some nodes did not respond in time and may be shown as unavailable.',
        );
        await expect(alert.item('disks-unavailable')).toBeVisible();
        await expect(alert.item('filter-not-applied')).toHaveCount(0);
        await expect(alert.codes).toContainText('bsc-timeout, bsc-pdisks-no-data, wb-incomplete');

        await page.screenshot({path: testInfo.outputPath('storage-nodes-data-issues.png')});
    });
});
