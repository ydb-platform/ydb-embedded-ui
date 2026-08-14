import {expect, test} from '@playwright/test';

import {
    DATABASE,
    OBJECT_PATH,
    RELATIVE_OBJECT_PATH,
    TABLET_ID,
    setupTabletObjectLinkMocks,
} from './tabletObjectLinkMocks';

test('monitoring user sees the owning table link for DataShard', async ({page}) => {
    const mocks = await setupTabletObjectLinkMocks(page, {
        tabletType: 'DataShard',
        isMonitoringAllowed: true,
    });

    await page.goto(`tablet/${TABLET_ID}?database=${encodeURIComponent(DATABASE)}`);

    await expect.poll(mocks.getHiveRequestCount).toBe(1);
    await expect(page.getByRole('term').filter({hasText: /^Table$/})).toBeVisible();
    const link = page.getByRole('link', {name: RELATIVE_OBJECT_PATH, exact: true});
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const url = new URL(href ?? '', 'http://localhost');
    expect(url.searchParams.get('database')).toBe(DATABASE);
    expect(url.searchParams.get('schema')).toBe(OBJECT_PATH);
});

for (const tabletType of ['PersQueue', 'PersQueueReadBalancer'] as const) {
    test(`monitoring user sees the owning topic link for ${tabletType}`, async ({page}) => {
        await setupTabletObjectLinkMocks(page, {tabletType, isMonitoringAllowed: true});
        await page.goto(`tablet/${TABLET_ID}?database=${encodeURIComponent(DATABASE)}`);

        await expect(page.getByText('Topic', {exact: true})).toBeVisible();
        await expect(
            page.getByRole('link', {name: RELATIVE_OBJECT_PATH, exact: true}),
        ).toBeVisible();
    });
}

test('user without monitoring permission does not request or see the object', async ({page}) => {
    const mocks = await setupTabletObjectLinkMocks(page, {
        tabletType: 'DataShard',
        isMonitoringAllowed: false,
    });
    await page.goto(`tablet/${TABLET_ID}?database=${encodeURIComponent(DATABASE)}`);

    await expect(page.getByText('Active', {exact: true}).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Table', {exact: true})).toHaveCount(0);
    expect(mocks.getHiveRequestCount()).toBe(0);
});

test('legacy user without monitoring permission flag sees the object', async ({page}) => {
    const mocks = await setupTabletObjectLinkMocks(page, {
        tabletType: 'DataShard',
    });
    await page.goto(`tablet/${TABLET_ID}?database=${encodeURIComponent(DATABASE)}`);

    await expect.poll(mocks.getHiveRequestCount).toBe(1);
    await expect(page.getByRole('link', {name: RELATIVE_OBJECT_PATH, exact: true})).toBeVisible();
});

test('incomplete Hive data omits the link without breaking tablet info', async ({page}) => {
    await setupTabletObjectLinkMocks(page, {
        tabletType: 'DataShard',
        isMonitoringAllowed: true,
        hiveInfo: {Tablets: []},
    });
    await page.goto(`tablet/${TABLET_ID}?database=${encodeURIComponent(DATABASE)}`);

    await expect(page.getByText('Active', {exact: true}).first()).toBeVisible();
    await expect(page.getByText('Table', {exact: true})).toHaveCount(0);
});
