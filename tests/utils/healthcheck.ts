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

export async function mockHealthcheckMeta(page: Page) {
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
    await page.route('**/meta/**', (route) => {
        const endpoint = new URL(route.request().url()).pathname.split('/').pop();
        switch (endpoint) {
            case 'clusters':
            case 'db_clusters':
                return route.fulfill({json: {clusters: [cluster]}});
            case 'cp_databases':
                return route.fulfill({json: {databases: [tenant]}});
            case 'tenantinfo':
                return route.fulfill({json: {TenantInfo: [tenant]}});
            case 'cluster_health':
            case 'healthcheck':
                return route.fulfill({json: healthcheckWithIssue});
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
