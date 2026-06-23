import type {Page} from '@playwright/test';

import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {QueryEditor} from './models/QueryEditor';

export const testQuery = 'SELECT 1, 2, 3, 4, 5;';

export async function setupQueryEditor(page: Page) {
    const pageQueryParams = {
        schema: database,
        database,
        tenantPage: 'query',
    };

    const tenantPage = new TenantPage(page);
    await tenantPage.goto(pageQueryParams);

    return new QueryEditor(page);
}
