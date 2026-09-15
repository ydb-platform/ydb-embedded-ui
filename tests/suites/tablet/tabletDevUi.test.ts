import {expect, test} from '@playwright/test';

import {TabletPage} from './TabletPage';
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
        baseURL,
    }) => {
        // The target is a ColumnShard; the request receiver is still Hive.
        const mock = await setupTabletDevUiMocks(
            page,
            {...scenario, tabletType: 'ColumnShard'},
            baseURL,
        );
        const tablet = new TabletPage(page);
        await tablet.goto();
        await tablet.storage.click();
        await expect(tablet.storagePool).toBeVisible();

        const info = mock.requests.find(
            ({url}) => new URL(url).searchParams.get('page') === 'TabletInfo',
        );
        expect(info).toBeDefined();
        const infoUrl = new URL(info?.url ?? '');
        expect(infoUrl.pathname).toBe(`/tablets/${scenario.suffix}`);
        expect(infoUrl.searchParams.get('TabletID')).toBe(HIVE_ID);
        expect(infoUrl.searchParams.get('tablet')).toBe(TABLET_ID);

        await tablet.stop.click();
        await expect(tablet.dialog).toBeVisible();
        expect(mock.requests.filter(({method}) => method === 'POST')).toHaveLength(0);
        await tablet.confirm('Stop');
        await expect(tablet.state('Stopped')).toBeVisible();
        await tablet.resume.click();
        await tablet.confirm('Resume');
        await expect(tablet.state('Active')).toBeVisible();

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
    test(`App link follows the backend page rule for ${tabletType}`, async ({page, baseURL}) => {
        await setupTabletDevUiMocks(page, {flag: true, tabletType}, baseURL);
        const tablet = new TabletPage(page);
        await tablet.goto();
        const app = tablet.app;
        const secure = ['DataShard', 'Hive', 'BSController'].includes(tabletType);
        await expect(app).toHaveAttribute(
            'href',
            new RegExp(`/tablets/${secure ? 'app/secure' : 'app'}\\?TabletID=${TABLET_ID}$`),
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
    baseURL,
}) => {
    const mock = await setupTabletDevUiMocks(
        page,
        {flag: true, admin: false, monitoring: false},
        baseURL,
    );
    const tablet = new TabletPage(page);
    await tablet.goto();
    await expect(tablet.state('Active')).toBeVisible();
    await expect(tablet.stop).toBeDisabled();
    await expect(tablet.resume).toBeDisabled();
    await expect(tablet.app).toHaveCount(0);
    await expect(tablet.storage).toHaveCount(0);
    expect(mock.requests).toHaveLength(0);
});

test('monitoring user without admin permission sees the secure backend denial', async ({
    page,
    baseURL,
}) => {
    const mock = await setupTabletDevUiMocks(page, {flag: true, admin: false}, baseURL);
    const tablet = new TabletPage(page);
    await tablet.goto();
    await tablet.stop.click();
    await tablet.confirm('Stop');
    await expect(tablet.denied).toBeVisible();
    await expect(tablet.state('Active')).toBeVisible();
    const mutations = mock.requests.filter(({method}) => method === 'POST');
    expect(mutations).toHaveLength(1);
    expect(new URL(mutations[0].url).pathname).toBe('/tablets/app/secure');
});

test('disabled flag keeps the DataShard App link on the legacy page', async ({page, baseURL}) => {
    await setupTabletDevUiMocks(page, {flag: false, tabletType: 'DataShard'}, baseURL);
    const tablet = new TabletPage(page);
    await tablet.goto();
    await expect(tablet.app).toHaveAttribute(
        'href',
        new RegExp(`/tablets/app\\?TabletID=${TABLET_ID}$`),
    );
    await expect(tablet.link('Counters')).toHaveAttribute(
        'href',
        new RegExp(`/tablets/counters\\?TabletID=${TABLET_ID}$`),
    );
    await expect(tablet.link('Executor DB internals')).toHaveAttribute(
        'href',
        new RegExp(`/tablets/executorInternals\\?TabletID=${TABLET_ID}$`),
    );
    await expect(tablet.link('State Storage')).toHaveAttribute(
        'href',
        new RegExp(`/tablets\\?SsId=${TABLET_ID}$`),
    );
});

for (const status of [401, 403]) {
    test(`capability HTTP ${status} preserves the auth gate`, async ({page, baseURL}) => {
        const mock = await setupTabletDevUiMocks(
            page,
            {flag: true, capabilityError: status},
            baseURL,
        );
        const tablet = new TabletPage(page);
        await tablet.goto();
        await expect(tablet.authError(status)).toBeVisible();
        await expect(tablet.stop).toHaveCount(0);
        expect(mock.requests).toHaveLength(0);
    });
}
