import type {Page, Route} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {QueryEditor} from './models/QueryEditor';

export const testQuery = 'SELECT 1, 2, 3, 4, 5;';

export async function setupQuerySettingsPage(page: Page) {
    const pageQueryParams = {
        schema: database,
        database,
        tenantPage: 'query',
    };

    const tenantPage = new TenantPage(page);
    await tenantPage.goto(pageQueryParams);

    return new QueryEditor(page);
}

export async function fulfillResourcePools(route: Route, pools: string[]) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            version: 8,
            result: [
                {
                    rows: pools.map((name) => [name]),
                    columns: [{name: 'Name', type: 'Utf8?'}],
                },
            ],
        }),
    });
}

export async function setupResourcePoolMock(page: Page, pools: string[] = ['default', 'olap']) {
    await page.route(`${backend}/viewer/json/query?*`, async (route: Route) => {
        const request = route.request();
        const postData = request.postData();

        if (postData && postData.includes('.sys/resource_pools')) {
            await fulfillResourcePools(route, pools);
        } else {
            await route.continue();
        }
    });
}
