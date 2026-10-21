import type {Page} from '@playwright/test';

import {database} from './constants';

const healthcheckWithIssue = {
    self_check_result: 'DEGRADED',
    issue_log: [
        {
            id: 'drawer-healthcheck-issue',
            status: 'YELLOW',
            message: 'Drawer healthcheck issue',
            location: {
                database: {
                    name: database,
                },
            },
        },
    ],
};

export async function mockHealthcheckWithIssue(page: Page) {
    await page.route('**/viewer/json/healthcheck**', (route) =>
        route.fulfill({json: healthcheckWithIssue}),
    );
}

export async function mockHealthcheckMeta(
    page: Page,
    {withSecondTarget = false}: {withSecondTarget?: boolean} = {},
) {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'meta_backend', {get: () => '/meta', set: () => {}});
        Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
    });
    const cluster = {
        name: 'healthcheck-test',
        title: 'Healthcheck test cluster',
        status: 'PRODUCTION',
        settings: JSON.stringify({use_meta_proxy: true}),
        cluster: {Domain: database, Overall: 'Yellow', overall_source: 'healthcheck'},
    };
    const tenant = {Name: database, Type: 'Dedicated', State: 'RUNNING', Overall: 'Yellow'};
    const clusters = withSecondTarget
        ? [cluster, {...cluster, name: 'healthcheck-second', title: 'Second healthcheck cluster'}]
        : [cluster];
    const tenants = withSecondTarget ? [tenant, {...tenant, Name: '/local-second'}] : [tenant];
    await page.route('**/meta/**', (route) => {
        const url = new URL(route.request().url());
        const endpoint = url.pathname.split('/').pop();
        switch (endpoint) {
            case 'clusters':
            case 'db_clusters':
                return route.fulfill({json: {clusters}});
            case 'cp_databases':
                return route.fulfill({json: {databases: tenants}});
            case 'tenantinfo':
                return route.fulfill({json: {TenantInfo: tenants}});
            case 'cluster_health':
            case 'healthcheck': {
                if (withSecondTarget) {
                    const targetDatabase = url.searchParams.get('database') ?? database;
                    const isSecondTarget =
                        targetDatabase === '/local-second' ||
                        url.searchParams.get('cluster_name') === 'healthcheck-second';
                    return route.fulfill({
                        json: {
                            ...healthcheckWithIssue,
                            issue_log: [
                                {
                                    ...healthcheckWithIssue.issue_log[0],
                                    id: `drawer-healthcheck-${isSecondTarget ? 'b' : 'a'}`,
                                    message: `Healthcheck issue ${isSecondTarget ? 'B' : 'A'}`,
                                    location: {database: {name: targetDatabase}},
                                },
                            ],
                        },
                    });
                }
                return route.fulfill({json: healthcheckWithIssue});
            }
            case 'cluster':
                return route.fulfill({json: cluster.cluster});
            case 'whoami':
                return route.fulfill({
                    json: {
                        UserSID: 'healthcheck-test',
                        IsViewerAllowed: true,
                        IsMonitoringAllowed: true,
                    },
                });
            case 'query':
                return route.fulfill({json: {version: 8, status: 'SUCCESS', result: []}});
            case 'nodelist':
                return route.fulfill({json: []});
            case 'capabilities':
                return route.fulfill({json: {}});
            default:
                return route.fallback();
        }
    });
}
