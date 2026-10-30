import {expect, test} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {EFlag} from '../../../src/types/api/enums';
import type {MetaExtendedClusterInfo} from '../../../src/types/api/meta';
import {PageModel} from '../../models/PageModel';

async function configureMeta(page: Page) {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'meta_backend', {get: () => '/meta', set: () => {}});
        Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
        localStorage.setItem('auto-refresh-interval', '0');
    });
    await page.route('**/viewer/json/nodelist*', (route) => route.fulfill({json: []}));
}

const issue = {
    id: 'disk',
    status: 'RED',
    level: 1,
    type: 'STORAGE',
    message: 'Original disk failure',
};
const getRow = (page: Page, name: string) => page.getByRole('row').filter({hasText: name});

async function expectNote(page: Page, row: Locator, text: string) {
    await row.locator('.ydb-entity-status__note').hover();
    await expect(page.getByText(text, {exact: true})).toBeVisible();
    await page.mouse.move(0, 0);
}

test('explains current failure, preserves cached issues and recovers through real refresh controls', async ({
    page,
}) => {
    await configureMeta(page);
    let overall = EFlag.Green;
    let error: string | undefined;
    let health = 'GOOD';
    let failDetails = false;
    await page.route('**/meta/**', (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/clusters')) {
            return route.fulfill({
                json: {
                    clusters: [
                        {
                            name: 'monitored',
                            cluster: {
                                Overall: overall,
                                error,
                                status_ttl_ms: error ? 0 : 120000,
                                overall_source: 'healthcheck',
                            },
                        },
                        {
                            name: 'unmonitored',
                            cluster: {Overall: EFlag.Green, status_ttl_ms: 120000},
                        },
                        {
                            name: 'critical-sibling',
                            cluster: {Overall: EFlag.Red, status_ttl_ms: 120000},
                        },
                    ],
                },
            });
        }
        if (path.endsWith('/cluster_health')) {
            return failDetails
                ? route.fulfill({status: 400, json: {error: '400 Bad Request'}})
                : route.fulfill({
                      json: {
                          self_check_result: health,
                          status_ttl_ms: 120000,
                          issue_log: [issue],
                      },
                  });
        }
        return route.fulfill({json: {}});
    });
    await new PageModel(page).goto();
    const row = getRow(page, 'monitored').filter({
        has: page.getByRole('link', {name: 'monitored', exact: true}),
    });
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(
        getRow(page, 'critical-sibling').getByText('Critical', {exact: true}),
    ).toBeVisible();
    await expect(
        getRow(page, 'unmonitored').getByRole('button', {name: /Healthcheck details/}),
    ).toHaveCount(0);
    const details = row.getByRole('button', {
        name: 'Healthcheck details for monitored',
        exact: true,
    });
    await details.click();
    const drawer = page.getByTestId('cluster-healthcheck-details');
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(drawer).not.toBeVisible();
    overall = EFlag.Grey;
    error = '400 Bad Request';
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    await expectNote(page, row, '400 Bad Request');
    await expect(row.locator('button button')).toHaveCount(0);
    await expect(details).toBeEnabled();
    await details.click();
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    failDetails = true;
    await drawer.getByRole('button', {name: 'Refresh', exact: true}).click();
    await expect(drawer.getByText('400 Bad Request', {exact: true}).first()).toBeVisible();
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    await expect(drawer.getByText('Unspecified', {exact: true}).first()).toBeVisible();
    failDetails = false;
    health = 'DEGRADED';
    await drawer.getByRole('button', {name: 'Refresh', exact: true}).click();
    await expect(drawer.getByText('Degraded', {exact: true}).first()).toBeVisible();
    await expect(drawer.getByText('400 Bad Request', {exact: true})).toHaveCount(0);
    await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(drawer).not.toBeVisible();
    overall = EFlag.Green;
    error = undefined;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(row.locator('.ydb-entity-status__note')).toHaveCount(0);
});

test('expires with polling disabled and cached data stays expired after navigation', async ({
    page,
}) => {
    await configureMeta(page);
    await page.clock.install();
    let requests = 0;
    const clusters: MetaExtendedClusterInfo[] = [
        {
            name: 'short-lived',
            cluster: {Overall: EFlag.Green, status_ttl_ms: 3000, overall_source: 'healthcheck'},
        },
        {
            name: 'expired',
            cluster: {
                Overall: EFlag.Grey,
                status_ttl_ms: 0,
                error: 'Healthcheck already expired',
                overall_source: 'healthcheck',
            },
        },
    ];
    await page.route('**/meta/**', (route) => {
        if (new URL(route.request().url()).pathname.endsWith('/clusters')) {
            requests++;
            return route.fulfill({json: {clusters}});
        }
        if (new URL(route.request().url()).pathname.endsWith('/db_clusters')) {
            return route.fulfill({json: {clusters: [{name: 'short-lived', domain: '/Root'}]}});
        }
        return route.fulfill({json: {}});
    });
    await new PageModel(page).goto();
    await expect(getRow(page, 'short-lived').getByText('Good', {exact: true})).toBeVisible();
    await expect(getRow(page, 'expired').getByText('Unknown', {exact: true})).toBeVisible();
    const requestsBefore = requests;
    await page.clock.runFor(4000);
    await expect(getRow(page, 'short-lived').getByText('Unknown', {exact: true})).toBeVisible();
    await expectNote(
        page,
        getRow(page, 'short-lived'),
        'The healthcheck has expired. Refresh to obtain a current result.',
    );
    expect(requests).toBe(requestsBefore);
    await page.evaluate(() => {
        window.history.pushState({}, '', '/cluster/nodes?clusterName=short-lived');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(getRow(page, 'short-lived')).toHaveCount(0);
    await page.evaluate(() => {
        window.history.back();
    });
    await expect(getRow(page, 'short-lived').getByText('Unknown', {exact: true})).toBeVisible();
    expect(requests).toBe(requestsBefore);
});

test('Meta database package consumer expires and rejects a failed refresh', async ({page}) => {
    await configureMeta(page);
    await page.clock.install();
    let fail = false;
    let ttl = 3000;
    let requests = 0;
    await page.route('**/meta/**', (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/cp_databases')) {
            throw new Error('EM fixture unexpectedly used the legacy database contract');
        }
        if (path.endsWith('/databases')) {
            requests++;
            const databases = [
                {
                    Name: '/Root/health-db',
                    Id: 'health-db',
                    Cluster: 'selected',
                    Type: 'Dedicated',
                    State: 'RUNNING',
                    Overall: EFlag.Green,
                    status_ttl_ms: ttl,
                },
            ];
            return fail
                ? route.fulfill({status: 400, json: {error: '400 Bad Request'}})
                : route.fulfill({json: {databases}});
        }
        if (path.endsWith('/db_clusters')) {
            return route.fulfill({
                json: {
                    clusters: [
                        {name: 'selected', domain: '/Root', settings: {use_meta_proxy: true}},
                    ],
                },
            });
        }
        if (path.endsWith('/nodelist')) {
            return route.fulfill({json: []});
        }
        return route.fulfill({json: {Capabilities: {}}});
    });
    await page.addInitScript(() => {
        window.e2eMetaDatabases = true;
    });
    await page.goto('/cluster/databases?clusterName=selected');
    const row = getRow(page, '/Root/health-db');
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    expect(requests).toBeGreaterThan(0);
    const initial = requests;
    await page.clock.runFor(4000);
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    expect(requests).toBe(initial);
    ttl = 120000;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    fail = true;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    await expectNote(page, row, '400 Bad Request');
});
