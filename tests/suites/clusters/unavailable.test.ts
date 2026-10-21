import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {MetaExtendedClusterInfo} from '../../../src/types/api/meta';
import {PageModel} from '../../models/PageModel';

const clusters: MetaExtendedClusterInfo[] = [
    {name: 'available', cluster: {Versions: ['25.1.1']}},
    {name: 'explicitly-available', settings: {unavailable: false}},
    {
        name: 'unavailable-object',
        settings: {unavailable: true},
        cluster: {Versions: ['25.2.1']},
    },
    {name: 'unavailable-json', settings: '{"unavailable":true}'},
];

async function openClusters(page: Page, clusterList = clusters) {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'meta_backend', {get: () => '/meta', set: () => {}});
        Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
    });
    await page.route('**/meta/**', (route) =>
        route.fulfill({
            json: new URL(route.request().url()).pathname.endsWith('/clusters')
                ? {clusters: clusterList}
                : {},
        }),
    );
    await page.route('**/viewer/json/nodelist*', (route) => route.fulfill({json: []}));
    await new PageModel(page).goto();
}

async function toggleAvailability(page: Page, value: 'Available' | 'Unavailable') {
    await page.getByTestId('clusters-availability').click();
    await page.getByRole('option', {name: new RegExp(`^${value}`)}).click();
    await page.keyboard.press('Escape');
}

test('filters by availability and keeps the selector available during search', async ({page}) => {
    await openClusters(page);
    const list = page.locator('.ydb-clusters');
    const availability = list.getByTestId('clusters-availability');
    const objectCluster = list.getByRole('link', {name: 'unavailable-object', exact: true});
    const jsonCluster = list.getByRole('link', {name: 'unavailable-json', exact: true});

    await expect(availability).toContainText('Available');
    await expect(list.getByRole('link', {name: 'available', exact: true})).toBeVisible();
    await expect(list.getByRole('link', {name: 'explicitly-available', exact: true})).toBeVisible();
    await expect(objectCluster).toHaveCount(0);
    await expect(jsonCluster).toHaveCount(0);
    await expect(list.getByText('Unavailable', {exact: true})).toHaveCount(0);
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();

    const versionBox = await list.getByRole('combobox').filter({hasText: 'Version:'}).boundingBox();
    const availabilityBox = await availability.boundingBox();
    if (!versionBox || !availabilityBox) {
        throw new Error('The version and availability filters must be visible');
    }
    expect(availabilityBox.x).toBeGreaterThanOrEqual(versionBox.x + versionBox.width);

    await availability.click();
    await expect(page.getByRole('option', {name: 'Available', exact: true})).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await expect(page.getByRole('option', {name: /^Unavailable/})).toHaveAttribute(
        'aria-selected',
        'false',
    );
    await expect(page.getByText('Marked by an administrator', {exact: true})).toBeVisible();
    await page.getByRole('option', {name: /^Unavailable/}).click();
    await page.keyboard.press('Escape');
    await expect(availability).toContainText('All');
    await expect(objectCluster).toBeVisible();
    await expect(jsonCluster).toBeVisible();
    await expect(
        list
            .getByRole('row')
            .filter({hasText: 'unavailable-object'})
            .getByText('Unavailable', {exact: true}),
    ).toBeVisible();
    await expect(
        list
            .getByRole('row')
            .filter({hasText: 'unavailable-json'})
            .getByText('Unavailable', {exact: true}),
    ).toBeVisible();
    await expect(list.getByText('Unavailable', {exact: true})).toHaveCount(2);
    const unavailableLabel = list
        .getByRole('row')
        .filter({hasText: 'unavailable-json'})
        .getByTestId('cluster-unavailable-label');
    const tooltip = page.getByRole('tooltip').filter({
        hasText:
            'Marked as unavailable by an administrator. This is independent of healthcheck. You can still open the cluster',
    });
    await unavailableLabel.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
    await jsonCluster.focus();
    await page.keyboard.press('Tab');
    await expect(unavailableLabel).toBeFocused();
    await expect(tooltip).toBeVisible();
    await expect(list.getByText('4 clusters found', {exact: true})).toBeVisible();

    await toggleAvailability(page, 'Available');
    await expect(availability).toContainText('Unavailable');
    await expect(list.getByRole('link', {name: 'available', exact: true})).toHaveCount(0);
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
    await toggleAvailability(page, 'Unavailable');
    await expect(availability).toContainText('None');
    await expect(list.getByText('0 clusters found', {exact: true})).toBeVisible();
    await toggleAvailability(page, 'Available');
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
    await expect(objectCluster).toHaveCount(0);
    await expect(jsonCluster).toHaveCount(0);
    await toggleAvailability(page, 'Unavailable');
    await expect(availability).toContainText('All');
    await list.getByPlaceholder('Cluster name, version, domain, host...').fill('unavailable');
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
    await toggleAvailability(page, 'Unavailable');
    await expect(objectCluster).toHaveCount(0);
    await expect(jsonCluster).toHaveCount(0);
    await expect(list.getByText('0 clusters found', {exact: true})).toBeVisible();
    await expect(availability).toBeVisible();
});

test('does not activate or change the selected row from an unavailable label', async ({page}) => {
    await openClusters(page);
    await toggleAvailability(page, 'Unavailable');
    const list = page.locator('.ydb-clusters');
    await list.getByPlaceholder('Cluster name, version, domain, host...').focus();
    await page.keyboard.press('ArrowDown');
    const selectedRow = list.locator('.ydb-keyboard-focused-row');
    await expect(selectedRow).toBeVisible();
    await expect(
        selectedRow.getByRole('link', {name: 'unavailable-json', exact: true}),
    ).toHaveCount(0);
    const selectedClusterName = await selectedRow
        .locator('.ydb-clusters__cluster-name')
        .innerText();
    const clusterLink = list.getByRole('link', {name: 'unavailable-json', exact: true});
    const label = list
        .getByRole('row')
        .filter({hasText: 'unavailable-json'})
        .getByTestId('cluster-unavailable-label');
    const listUrl = page.url();
    await clusterLink.focus();
    await page.keyboard.press('Tab');
    await expect(label).toBeFocused();

    for (const key of ['Enter', 'ArrowDown', 'ArrowUp']) {
        await page.keyboard.press(key);
        await expect(page).toHaveURL(listUrl);
        await expect(label).toBeFocused();
        await expect(selectedRow.locator('.ydb-clusters__cluster-name')).toHaveText(
            selectedClusterName,
        );
    }
});

test('combines availability with the version filter', async ({page}) => {
    await openClusters(page);
    const list = page.locator('.ydb-clusters');
    await list.getByRole('combobox').filter({hasText: 'Version:'}).click();
    await page.getByRole('option', {name: '25.2.1', exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(list.getByText('0 clusters found', {exact: true})).toBeVisible();
    await toggleAvailability(page, 'Unavailable');
    await expect(list.getByRole('link', {name: 'unavailable-object', exact: true})).toBeVisible();
    await expect(list.getByRole('link', {name: 'unavailable-json', exact: true})).toHaveCount(0);
    await expect(list.getByRole('link', {name: 'available', exact: true})).toHaveCount(0);
    await expect(list.getByText('1 cluster found', {exact: true})).toBeVisible();
});

for (const [name, clusterList] of [
    ['available clusters', clusters.slice(0, 2)],
    ['only unavailable clusters', clusters.slice(2)],
    ['empty list', []],
] as const) {
    test(`handles ${name}`, async ({page}) => {
        await openClusters(page, [...clusterList]);
        const list = page.locator('.ydb-clusters');
        if (name === 'only unavailable clusters') {
            await expect(list.getByText('0 clusters found', {exact: true})).toBeVisible();
            await toggleAvailability(page, 'Unavailable');
            await expect(
                list.getByRole('link', {name: 'unavailable-json', exact: true}),
            ).toBeVisible();
            await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
        } else {
            await expect(
                list.getByText(`${clusterList.length} clusters found`, {exact: true}),
            ).toBeVisible();
            await expect(list.getByTestId('clusters-availability')).toHaveCount(0);
        }
    });
}

test('keeps a selected unavailable filter accessible after the last unavailable cluster disappears', async ({
    page,
}) => {
    const clusterList = [...clusters];
    await openClusters(page, clusterList);
    await toggleAvailability(page, 'Unavailable');
    await toggleAvailability(page, 'Available');
    const list = page.locator('.ydb-clusters');
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
    clusterList.splice(0, clusterList.length, ...clusters.slice(0, 2));
    await page.getByRole('button', {name: 'Refresh', exact: true}).click();
    await expect(list.getByText('0 clusters found', {exact: true})).toBeVisible();
    await expect(list.getByTestId('clusters-availability')).toContainText('Unavailable');
    await toggleAvailability(page, 'Available');
    await toggleAvailability(page, 'Unavailable');
    await expect(list.getByText('2 clusters found', {exact: true})).toBeVisible();
    await expect(list.getByTestId('clusters-availability')).toHaveCount(0);
});
