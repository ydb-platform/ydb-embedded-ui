import {expect, test} from '@playwright/test';

import {setupTabletDevUiMocks} from './tabletDevUiMocks';
import {HIVE_ID, TABLET_ID} from './tabletObjectLinkMocks';

for (const scenario of [
    {name: 'enabled', flag: true, suffix: 'app/secure'},
    {name: 'disabled', flag: false, suffix: 'app'},
    {name: 'missing', suffix: 'app'},
    {name: 'unavailable', capabilityError: 503, suffix: 'app'},
]) {
    test(`Tablet DevUI ${scenario.name}: Storage and stop/resume use the selected path`, async ({
        page,
    }) => {
        // The target is a ColumnShard; the request receiver is still Hive.
        const mock = await setupTabletDevUiMocks(page, {...scenario, tabletType: 'ColumnShard'});
        await page.goto(mock.url);
        await page.getByRole('link', {name: 'Storage', exact: true}).click();
        await expect(page.getByText('tablet-devui-test-pool', {exact: true})).toBeVisible();

        const info = mock.requests.find(
            ({url}) => new URL(url).searchParams.get('page') === 'TabletInfo',
        );
        expect(info).toBeDefined();
        const infoUrl = new URL(info?.url ?? '');
        expect(infoUrl.pathname).toBe(`/tablets/${scenario.suffix}`);
        expect(infoUrl.searchParams.get('TabletID')).toBe(HIVE_ID);
        expect(infoUrl.searchParams.get('tablet')).toBe(TABLET_ID);

        await page.getByRole('button', {name: 'Stop', exact: true}).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        expect(mock.requests.filter(({method}) => method === 'POST')).toHaveLength(0);
        await page
            .getByRole('dialog')
            .getByRole('button', {name: 'Stop tablet', exact: true})
            .click();
        await expect(page.getByText('Stopped', {exact: true}).first()).toBeVisible();
        await page.getByRole('button', {name: 'Resume', exact: true}).click();
        await page
            .getByRole('dialog')
            .getByRole('button', {name: 'Resume tablet', exact: true})
            .click();
        await expect(page.getByText('Active', {exact: true}).first()).toBeVisible();

        const mutations = mock.requests.filter(({method}) => method === 'POST');
        expect(mutations).toHaveLength(2);
        expect(mutations.map(({url}) => new URL(url).searchParams.get('page'))).toEqual([
            'StopTablet',
            'ResumeTablet',
        ]);
        for (const request of mutations) {
            const url = new URL(request.url);
            expect(url.pathname).toBe(`/tablets/${scenario.suffix}`);
            expect(url.searchParams.get('TabletID')).toBe(HIVE_ID);
            expect(url.searchParams.get('tablet')).toBe(TABLET_ID);
        }
    });
}

for (const tabletType of [
    'DataShard',
    'Hive',
    'BSController',
    'ColumnShard',
    'SchemeShard',
    'FutureTablet',
]) {
    test(`App link follows the backend page rule for ${tabletType}`, async ({page}) => {
        const mock = await setupTabletDevUiMocks(page, {flag: true, tabletType});
        await page.goto(mock.url);
        const app = page.getByRole('link', {name: 'App', exact: true});
        const secure = ['DataShard', 'Hive', 'BSController'].includes(tabletType);
        await expect(app).toHaveAttribute(
            'href',
            new RegExp(`/tablets/${secure ? 'app/secure' : 'app'}\\?TabletID=${TABLET_ID}$`),
        );
        await expect(page.getByRole('link', {name: 'Counters', exact: true})).toHaveAttribute(
            'href',
            new RegExp(`/tablets/counters\\?TabletID=${TABLET_ID}$`),
        );
        await expect(
            page.getByRole('link', {name: 'Executor DB internals', exact: true}),
        ).toHaveAttribute(
            'href',
            new RegExp(`/tablets/executorInternals\\?TabletID=${TABLET_ID}$`),
        );
        await expect(page.getByRole('link', {name: 'State Storage', exact: true})).toHaveAttribute(
            'href',
            new RegExp(`/tablets\\?SsId=${TABLET_ID}$`),
        );
        const popupPromise = page.waitForEvent('popup');
        await app.click();
        const popup = await popupPromise;
        await expect(
            popup.getByRole('heading', {name: `App for ${tabletType} ${TABLET_ID}`}),
        ).toBeVisible();
        await popup.close();
    });
}

test('user without monitoring permission keeps disabled controls and hidden DevUI', async ({
    page,
}) => {
    const mock = await setupTabletDevUiMocks(page, {flag: true, admin: false, monitoring: false});
    await page.goto(mock.url);
    await expect(page.getByText('Active', {exact: true}).first()).toBeVisible();
    await expect(page.getByRole('button', {name: 'Stop', exact: true})).toBeDisabled();
    await expect(page.getByRole('button', {name: 'Resume', exact: true})).toBeDisabled();
    await expect(page.getByRole('link', {name: 'App', exact: true})).toHaveCount(0);
    await expect(page.getByRole('link', {name: 'Storage', exact: true})).toHaveCount(0);
    expect(mock.requests).toHaveLength(0);
});

test('monitoring user without admin permission sees the secure backend denial', async ({page}) => {
    const mock = await setupTabletDevUiMocks(page, {flag: true, admin: false});
    await page.goto(mock.url);
    await page.getByRole('button', {name: 'Stop', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Stop tablet', exact: true}).click();
    await expect(
        page
            .getByRole('dialog')
            .getByText("You don't have enough rights to complete the operation", {exact: true}),
    ).toBeVisible();
    await expect(page.getByText('Active', {exact: true}).first()).toBeVisible();
    const mutations = mock.requests.filter(({method}) => method === 'POST');
    expect(mutations).toHaveLength(1);
    expect(new URL(mutations[0].url).pathname).toBe('/tablets/app/secure');
});

test('disabled flag keeps the DataShard App link on the legacy page', async ({page}) => {
    const mock = await setupTabletDevUiMocks(page, {flag: false, tabletType: 'DataShard'});
    await page.goto(mock.url);
    await expect(page.getByRole('link', {name: 'App', exact: true})).toHaveAttribute(
        'href',
        new RegExp(`/tablets/app\\?TabletID=${TABLET_ID}$`),
    );
});

for (const status of [401, 403]) {
    test(`capability HTTP ${status} preserves the auth gate`, async ({page}) => {
        const mock = await setupTabletDevUiMocks(page, {flag: true, capabilityError: status});
        await page.goto(mock.url);
        await expect(
            page.getByText(status === 401 ? 'Authentication required' : 'Access denied', {
                exact: true,
            }),
        ).toBeVisible();
        await expect(page.getByRole('button', {name: 'Stop', exact: true})).toHaveCount(0);
        expect(mock.requests).toHaveLength(0);
    });
}
