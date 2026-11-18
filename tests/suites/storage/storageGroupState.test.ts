import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import type {TGroupsStorageGroupInfo} from '../../../src/types/api/storage';
import {EMPTY_DATA_PLACEHOLDER} from '../../../src/utils/emptyDataPlaceholder';
import {PageModel} from '../../models/PageModel';

import {StoragePage} from './StoragePage';
import {DATABASE, GROUP_ID, setupVDiskPageMocks} from './vdiskPageMocks';

const scenarios = [
    {
        name: 'structured fail-realm count takes precedence over State and MissingDisks',
        version: 13,
        group: {
            State: 'ok',
            StateInfo: {
                Status: 'degraded',
                Count: {FailRealms: {Value: 2}},
                FailedDomainsPerRealm: [3, 1],
            },
            MissingDisks: '5',
        },
        title: 'Degraded',
        value: '2 (3,1)',
        theme: 'danger',
    },
    {
        name: 'structured disk count works without State',
        version: 13,
        group: {
            ErasureSpecies: 'block-4-2',
            StateInfo: {Status: 'starting', Count: {Disks: {Value: 1}}},
        },
        title: 'Starting',
        value: '1',
        theme: 'warning',
    },
    {
        name: 'healthy structured state has no count',
        version: 13,
        group: {State: 'dead:3', StateInfo: {Status: 'ok'}},
        title: 'Ok',
        value: undefined,
        theme: 'success',
    },
    {
        name: 'old backend falls back to State',
        version: 12,
        group: {State: 'degraded:2(3,1)', MissingDisks: '5'},
        title: 'Degraded',
        value: '2 (3,1)',
        theme: 'danger',
    },
    ...[':()', ':0()'].map((State) => ({
        name: `shows a plain placeholder for State ${State} without a status`,
        version: 13,
        group: {State},
        title: EMPTY_DATA_PLACEHOLDER,
        value: undefined,
        theme: undefined,
    })),
] satisfies {
    name: string;
    version: number;
    group: TGroupsStorageGroupInfo;
    title: string;
    value?: string;
    theme?: string;
}[];

async function expectState(container: Locator, scenario: (typeof scenarios)[number]) {
    const label = container.locator('.ydb-disk-status__label');
    if (!scenario.theme) {
        await expect(container).toBeVisible();
        await expect(container).toContainText(EMPTY_DATA_PLACEHOLDER);
        await expect(label).toHaveCount(0);
        return;
    }

    await expect(label).toBeVisible();
    await expect(label.locator('.g-label__content')).toHaveText(scenario.title);
    await expect(label).toHaveClass(new RegExp(`g-label_theme_${scenario.theme}`));
    if (scenario.value) {
        await expect(label.locator('.g-label__key')).toHaveText(scenario.value);
    } else {
        await expect(label.locator('.g-label__key')).toHaveCount(0);
    }
}

test.describe('Storage group state labels', () => {
    for (const theme of ['light', 'dark']) {
        for (const scenario of scenarios) {
            test(`${scenario.name} in ${theme} theme`, async ({page}, testInfo) => {
                await setupVDiskPageMocks(page, {
                    capacityVersions: {storageGroups: scenario.version, viewerNodes: 20},
                });
                await page.addInitScript((themeValue) => {
                    localStorage.setItem('theme', themeValue);
                    localStorage.setItem(
                        'storageGroupsSelectedColumns',
                        JSON.stringify([
                            {id: 'GroupId', selected: true},
                            {id: 'State', selected: true},
                        ]),
                    );
                }, theme);
                const group: TGroupsStorageGroupInfo = {
                    GroupId: GROUP_ID,
                    ErasureSpecies: 'mirror-3-dc',
                    ...scenario.group,
                };
                await page.route('**/storage/groups?*', (route) =>
                    route.fulfill({
                        json: {
                            Version: scenario.version,
                            StorageGroups: [group],
                            TotalGroups: 1,
                            FoundGroups: 1,
                        },
                    }),
                );

                const storageResponse = page.waitForResponse(
                    (response) =>
                        response.url().includes('/storage/groups?') &&
                        new URL(response.url()).searchParams
                            .get('fields_required')
                            ?.includes('State') === true &&
                        response.ok(),
                );
                await new PageModel(page, 'cluster/storage', {
                    database: DATABASE,
                    type: 'groups',
                }).goto();
                await storageResponse;

                const row = new StoragePage(page).getGroupRow(GROUP_ID);
                await expectState(row, scenario);

                const groupResponse = page.waitForResponse(
                    (response) =>
                        response.url().includes('/storage/groups?') &&
                        new URL(response.url()).searchParams.get('group_id') === GROUP_ID &&
                        new URL(response.url()).searchParams.get('fields_required') === 'all' &&
                        response.ok(),
                );
                await row.getByRole('link', {name: GROUP_ID, exact: true}).click();
                await groupResponse;

                for (const container of [
                    row,
                    page.locator('.ydb-storage-group-page__title'),
                    page.locator('.header__left-controls'),
                ]) {
                    await expectState(container, scenario);
                }

                await page.screenshot({path: testInfo.outputPath('storage-group-state.png')});
            });
        }
    }
});
