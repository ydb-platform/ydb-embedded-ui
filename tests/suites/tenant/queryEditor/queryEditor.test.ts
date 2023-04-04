import {test, expect} from '@playwright/test';

import {tenantName} from '../../../utils/constants';

import {TenantPage} from '../TenantPage';
import {QueryEditor} from './QueryEditor';

test.describe('Test Query Editor', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            name: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Can run scipt', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.runScript(testQuery);

        await expect(queryEditor.getRunResultTable()).toBeVisible();
    });

    test('Can run scan', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.runScan(testQuery);

        await expect(queryEditor.getRunResultTable()).toBeVisible();
    });

    test('Can get explain', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery);

        const explainSchema = await queryEditor.getExplainResult('Schema');
        await expect(explainSchema).toBeVisible();

        const explainJSON = await queryEditor.getExplainResult('JSON');
        await expect(explainJSON).toBeVisible();

        const explainAST = await queryEditor.getExplainResult('AST');
        await expect(explainAST).toBeVisible();
    });
});
