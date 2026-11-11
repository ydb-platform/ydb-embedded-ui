import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {DataIssuesAlert} from '../../models/DataIssuesAlert';
import {DataIssuesIndicator} from '../../models/DataIssuesIndicator';
import {PaginatedTable} from '../paginatedTable/paginatedTable';

import {StoragePage} from './StoragePage';
import {
    DATA_ISSUES_GROUP_ID,
    LONG_LIST_GROUPS_COUNT,
    createGroupsResponse,
    createLongGroupsResponse,
    createNodesResponse,
    getLongListGroupId,
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
        await expect(new DataIssuesIndicator(page).button).toHaveCount(0);
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

        const indicator = new DataIssuesIndicator(page);
        await expect(indicator.button).toHaveText('Data issues');
        await indicator.open();
        await expect(indicator.item('list-incomplete')).toHaveText(
            'The list may be incomplete: some data sources did not respond.',
        );
        await expect(indicator.item('partial-data')).toBeVisible();
        await expect(indicator.items).toHaveCount(2);
        await expect(indicator.codes).toHaveText(
            'Problems reported by the server: bsc-timeout, wb-incomplete-groups, bsc-pdisks-no-data',
        );

        await page.screenshot({path: testInfo.outputPath('storage-groups-data-issues.png')});
    });

    test('warns that sorting was not applied', async ({page}) => {
        await setupDataIssuesMocks(page, {
            groups: () => createGroupsResponse({Problems: ['bsc-error'], NeedSort: true}),
        });
        await openStoragePage(page, {type: 'groups'});

        const indicator = new DataIssuesIndicator(page);
        await indicator.open();
        await expect(indicator.item('sort-not-applied')).toHaveText(
            'Sorting was not applied: rows are shown in arbitrary order.',
        );
    });

    test('removes the warning when the next response has no problems', async ({page}) => {
        let broken = true;
        await setupDataIssuesMocks(page, {
            groups: () => createGroupsResponse(broken ? {Problems: ['bsc-timeout']} : {}),
        });
        const storagePage = await openStoragePage(page, {type: 'groups'});

        const indicator = new DataIssuesIndicator(page);
        await expect(indicator.button).toBeVisible();

        broken = false;
        const tableResponse = waitForTableResponse(page, 'groups');
        await page.reload();
        await tableResponse;

        await expect(storagePage.getGroupRow(DATA_ISSUES_GROUP_ID)).toBeVisible();
        await expect(indicator.button).toHaveCount(0);
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

        await expect(new DataIssuesIndicator(page).button).toBeVisible();
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

        // There are no groups to show, so the reason takes their place
        const alert = new DataIssuesAlert(page);
        await expect(alert.item('group-not-applied')).toHaveText('Grouping was not applied.');
        await expect(alert.item('list-incomplete')).toBeVisible();
        await expect(page.getByText('No such groups')).toHaveCount(0);
        await expect(new DataIssuesIndicator(page).button).toBeVisible();

        await page.screenshot({path: testInfo.outputPath('storage-groups-grouping-issue.png')});
    });
});

test.describe('Storage groups data issues of a long list', () => {
    const BSC_TIMEOUT = ['bsc-timeout'];
    const CHUNK_SIZE = 20;
    const ROW_HEIGHT = 41;

    /** Where the table starts in the scrolled content: changes only if something above it does */
    function getTableContentOffset(page: Page) {
        return page.evaluate(() => {
            const container = document.querySelector('.ydb-cluster');
            const table = document.querySelector('.ydb-paginated-table__table');
            if (!container || !table) {
                return undefined;
            }

            return Math.round(
                table.getBoundingClientRect().top -
                    container.getBoundingClientRect().top +
                    container.scrollTop,
            );
        });
    }

    test('shows the warning for problems of a middle chunk when its rows are rendered', async ({
        page,
    }, testInfo) => {
        // Only the requests for the rows of the middle of the list report a problem
        const from = LONG_LIST_GROUPS_COUNT / 2 - 40;
        const to = LONG_LIST_GROUPS_COUNT / 2 + 40;
        await setupDataIssuesMocks(page, {
            groups: (url) =>
                createLongGroupsResponse(url, (rows) =>
                    rows.from < to && rows.to > from ? BSC_TIMEOUT : [],
                ),
        });
        const storagePage = await openStoragePage(page, {type: 'groups'});
        const indicator = new DataIssuesIndicator(page);

        // The first rows were loaded without problems
        await expect(storagePage.getGroupRow(getLongListGroupId(0))).toBeVisible();
        await expect(indicator.button).toHaveCount(0);
        const tableOffset = await getTableContentOffset(page);

        await new PaginatedTable(page).scrollToMiddle();
        await expect(
            storagePage.getGroupRow(getLongListGroupId(LONG_LIST_GROUPS_COUNT / 2)),
        ).toBeVisible();

        // The controls are sticky: the warning is in sight next to the rows it is about
        await expect(indicator.button).toBeInViewport();
        await indicator.open();
        await expect(indicator.item('list-incomplete')).toBeVisible();
        await expect(indicator.codes).toHaveText('Problems reported by the server: bsc-timeout');
        // Nothing was inserted above the table, so its rows did not move
        expect(await getTableContentOffset(page)).toBe(tableOffset);

        await page.screenshot({path: testInfo.outputPath('storage-groups-middle-chunk.png')});
    });

    test('keeps the warning of the first chunk while its rows are rendered', async ({page}) => {
        // Only the request that starts the list reports a problem, the following ones are clean
        let cleanChunkRequested = false;
        await setupDataIssuesMocks(page, {
            groups: (url) =>
                createLongGroupsResponse(url, (rows) => {
                    if (rows.from === 0) {
                        return BSC_TIMEOUT;
                    }
                    cleanChunkRequested = true;
                    return [];
                }),
        });
        const storagePage = await openStoragePage(page, {type: 'groups'});
        const indicator = new DataIssuesIndicator(page);
        const table = new PaginatedTable(page);

        await expect(storagePage.getGroupRow(getLongListGroupId(0))).toBeVisible();
        await expect(indicator.button).toBeVisible();
        const tableOffset = await getTableContentOffset(page);

        // Clean neighbouring chunks arrive after the first one and do not erase its warning
        await table.scrollToPosition(600);
        await expect.poll(() => cleanChunkRequested).toBe(true);
        await expect(storagePage.getGroupRow(getLongListGroupId(25))).toBeVisible();
        await expect(indicator.button).toBeVisible();

        // A few chunks further the first chunk is still kept loaded, but its rows are not in the table:
        // the warning is about the rendered rows only
        await table.scrollToPosition(ROW_HEIGHT * 5 * CHUNK_SIZE);
        await expect(storagePage.getGroupRow(getLongListGroupId(5 * CHUNK_SIZE))).toBeVisible();
        await expect(storagePage.getGroupRow(getLongListGroupId(0))).toHaveCount(0);
        await expect(indicator.button).toHaveCount(0);
        expect(await getTableContentOffset(page)).toBe(tableOffset);

        // Far away the first chunk is not even mounted
        await table.scrollToBottom();
        await expect(
            storagePage.getGroupRow(getLongListGroupId(LONG_LIST_GROUPS_COUNT - 1)),
        ).toBeVisible();
        await expect(indicator.button).toHaveCount(0);
        expect(await getTableContentOffset(page)).toBe(tableOffset);

        // Back at the rows that were loaded with the problem
        await table.scrollToPosition(0);
        await expect(storagePage.getGroupRow(getLongListGroupId(0))).toBeVisible();
        await expect(indicator.button).toBeVisible();
        expect(await getTableContentOffset(page)).toBe(tableOffset);
    });
});

test.describe('Storage nodes data issues', () => {
    test('shows no warning when the handler reports no problems', async ({page}) => {
        await setupDataIssuesMocks(page, {});
        const storagePage = await openStoragePage(page, {type: 'nodes'});

        await expect(storagePage.table.getByText('storage-node-1', {exact: true})).toBeVisible();
        await expect(new DataIssuesIndicator(page).button).toHaveCount(0);
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

        const indicator = new DataIssuesIndicator(page);
        await indicator.open();
        await expect(indicator.item('nodes-status-unreliable')).toHaveText(
            'Some nodes did not respond in time and may be shown as unavailable.',
        );
        await expect(indicator.item('disks-unavailable')).toBeVisible();
        await expect(indicator.item('filter-not-applied')).toHaveCount(0);
        await expect(indicator.codes).toContainText(
            'bsc-timeout, bsc-pdisks-no-data, wb-incomplete',
        );

        await page.screenshot({path: testInfo.outputPath('storage-nodes-data-issues.png')});
    });
});
