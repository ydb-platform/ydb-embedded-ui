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

const capabilities = {
    Capabilities: {'/meta/clusters': 2, '/meta/databases': 2, '/meta/cluster_health': 2},
};

const issue = {
    id: 'disk',
    status: 'RED',
    level: 1,
    type: 'STORAGE',
    message: 'Original disk failure',
};
const getRow = (page: Page, name: string) => page.getByRole('row').filter({hasText: name});

async function expectNote(page: Page, row: Locator, text: string) {
    await row
        .getByRole('button', {name: /^Healthcheck details/})
        .or(row.locator('.ydb-entity-status__note'))
        .hover();
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
        return route.fulfill({json: capabilities});
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
        name: /^Healthcheck details for monitored /,
    });
    await expect(details).toContainText('Good');
    await details.click();
    const drawer = page.getByTestId('cluster-healthcheck-details');
    const currentHealth = drawer.getByRole('group', {name: 'Current health'});
    const savedIssues = drawer.getByRole('region', {name: 'Saved issues'});
    await expect(currentHealth.getByText('Good', {exact: true})).toBeVisible();
    await expect(savedIssues).toBeVisible();
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(drawer).not.toBeVisible();
    overall = EFlag.Grey;
    error = '400 Bad Request';
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    await row.getByRole('link', {name: 'monitored', exact: true}).focus();
    await page.keyboard.press('Tab');
    await expect(details).toBeFocused();
    await expect(page.getByRole('tooltip')).toContainText('400 Bad Request');
    await expect(details).toHaveAccessibleDescription(/400 Bad Request/);
    await expect(row.locator('button button')).toHaveCount(0);
    await expect(details).toBeEnabled();
    await expect(details).toContainText('Unknown');
    await details.press('Enter');
    await expect(currentHealth.getByText('Unknown', {exact: true})).toBeVisible();
    await expect(currentHealth.getByText('400 Bad Request', {exact: true})).toBeVisible();
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    failDetails = true;
    await Promise.all([
        page.waitForResponse(
            (response) =>
                new URL(response.url()).pathname.endsWith('/cluster_health') &&
                response.status() === 400,
        ),
        drawer.getByRole('button', {name: 'Refresh', exact: true}).click(),
    ]);
    await expect(drawer.getByText('400 Bad Request', {exact: true})).toHaveCount(1);
    await expect(
        drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
    failDetails = false;
    health = 'DEGRADED';
    await drawer.getByRole('button', {name: 'Refresh', exact: true}).click();
    await expect(savedIssues.getByText('400 Bad Request', {exact: true})).toHaveCount(0);
    await expect(currentHealth.getByText('400 Bad Request', {exact: true})).toBeVisible();
    await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
    await expect(drawer).not.toBeVisible();
    overall = EFlag.Green;
    error = undefined;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(row.locator('.ydb-entity-status__note')).toHaveCount(0);
    await details.click();
    await expect(currentHealth.getByText('Good', {exact: true})).toBeVisible();
    await expect(currentHealth.getByText('400 Bad Request', {exact: true})).toHaveCount(0);
    await expect(
        savedIssues.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
    ).toBeVisible();
});

test('failed cluster refresh preserves fresh health until expiry and cached data stays expired after navigation', async ({
    page,
}) => {
    await configureMeta(page);
    await page.clock.install();
    let fail = false;
    let requests = 0;
    const clusters: MetaExtendedClusterInfo[] = [
        {
            name: 'short-lived',
            cluster: {Overall: EFlag.Green, status_ttl_ms: 10000, overall_source: 'healthcheck'},
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
            return fail
                ? route.fulfill({status: 400, json: {error: '400 Bad Request'}})
                : route.fulfill({json: {clusters}});
        }
        if (new URL(route.request().url()).pathname.endsWith('/db_clusters')) {
            return route.fulfill({json: {clusters: [{name: 'short-lived', domain: '/Root'}]}});
        }
        return route.fulfill({json: capabilities});
    });
    await new PageModel(page).goto();
    await expect(getRow(page, 'short-lived').getByText('Good', {exact: true})).toBeVisible();
    await expect(getRow(page, 'expired').getByText('Unknown', {exact: true})).toBeVisible();
    fail = true;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    const listError = page.locator('.ydb-clusters .ydb-response-error');
    await expect(listError).toHaveCount(1);
    await expect(listError).toContainText('400 Bad Request');
    await expect(getRow(page, 'short-lived').getByText('Good', {exact: true})).toBeVisible();
    await expect(getRow(page, 'short-lived').locator('.ydb-entity-status__note')).toHaveCount(0);
    const requestsBefore = requests;
    await page.clock.runFor(11000);
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

test('Meta database list preserves fresh health on failure and backend problem membership after expiry', async ({
    page,
}) => {
    await configureMeta(page);
    await page.clock.install();
    let fail = false;
    let ttl = 10000;
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
                {
                    Name: '/Root/problem-db',
                    Id: 'problem-db',
                    Cluster: 'selected',
                    Type: 'Dedicated',
                    State: 'RUNNING',
                    Overall: EFlag.Red,
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
        return route.fulfill({json: capabilities});
    });
    await page.addInitScript(() => {
        window.e2eMetaDatabases = true;
    });
    await page.goto('/cluster/databases?clusterName=selected');
    const row = getRow(page, '/Root/health-db');
    const problemRow = getRow(page, '/Root/problem-db');
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(problemRow.getByText('Critical', {exact: true})).toBeVisible();
    expect(requests).toBeGreaterThan(0);
    const initial = requests;
    await page.getByRole('radio', {name: 'With problems', exact: true}).check();
    await expect(row).toHaveCount(0);
    await expect(problemRow.getByText('Critical', {exact: true})).toBeVisible();
    await page.clock.runFor(11000);
    await expect(problemRow.getByText('Unknown', {exact: true})).toBeVisible();
    await expect(row).toHaveCount(0);
    await page.getByRole('radio', {name: 'All', exact: true}).check();
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    expect(requests).toBe(initial);
    ttl = 120000;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(problemRow.getByText('Critical', {exact: true})).toBeVisible();
    fail = true;
    await page.getByRole('button', {name: 'Refresh', exact: true}).first().click();
    const listError = page.locator('.ydb-response-error');
    await expect(listError).toHaveCount(1);
    await expect(listError).toContainText('400 Bad Request');
    await expect(row.getByText('Good', {exact: true})).toBeVisible();
    await expect(problemRow.getByText('Critical', {exact: true})).toBeVisible();
    await expect(row.locator('.ydb-entity-status__note')).toHaveCount(0);
    await expect(problemRow.locator('.ydb-entity-status__note')).toHaveCount(0);
    const requestsAfterFailure = requests;
    await page.clock.fastForward(120000);
    await expect(row.getByText('Unknown', {exact: true})).toBeVisible();
    await expect(problemRow.getByText('Unknown', {exact: true})).toBeVisible();
    await expectNote(page, row, 'The healthcheck has expired. Refresh to obtain a current result.');
    expect(requests).toBe(requestsAfterFailure);
    await page.getByRole('radio', {name: 'With problems', exact: true}).check();
    await expect(row).toHaveCount(0);
    await expect(problemRow.getByText('Unknown', {exact: true})).toBeVisible();
    const href = await problemRow
        .getByRole('link', {name: 'problem-db', exact: true})
        .getAttribute('href');
    if (!href) {
        throw new Error('The expired database must keep its navigation link');
    }
    const destination = new URL(href, page.url());
    expect(destination.searchParams.get('database')).toBe('/Root/problem-db');
    expect(destination.searchParams.get('clusterName')).toBe('selected');
    const search = page.getByPlaceholder('Database name');
    await search.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('/Root/problem-db');
    await Promise.all([page.waitForURL(destination.href), search.press('Enter')]);
});

for (const {version, status} of [
    {version: 1, status: 'Good'},
    {version: 2, status: 'Unknown'},
]) {
    test(`version ${version} determines whether missing TTL makes health unknown`, async ({
        page,
    }) => {
        await configureMeta(page);
        await page.route('**/meta/**', (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path.endsWith('/clusters')) {
                return route.fulfill({
                    json: {
                        clusters: [
                            {
                                name: 'cluster',
                                cluster: {Overall: EFlag.Green, overall_source: 'healthcheck'},
                            },
                        ],
                    },
                });
            }
            if (path.endsWith('/cluster_health')) {
                return route.fulfill({json: {self_check_result: 'GOOD', issue_log: [issue]}});
            }
            return route.fulfill({
                json: {Capabilities: {'/meta/clusters': version, '/meta/cluster_health': version}},
            });
        });
        await new PageModel(page).goto();
        const row = getRow(page, 'cluster').filter({
            has: page.getByRole('link', {name: 'cluster', exact: true}),
        });
        await expect(row.getByText(status, {exact: true})).toBeVisible();
        await row
            .getByRole('button', {name: `Healthcheck details for cluster ${status}`, exact: true})
            .click();
        const drawer = page.getByTestId('cluster-healthcheck-details');
        await expect(drawer.getByText(status, {exact: true}).first()).toBeVisible();
        await expect(
            drawer.getByRole('button', {name: 'Critical Original disk failure', exact: true}),
        ).toBeVisible();
    });
}
