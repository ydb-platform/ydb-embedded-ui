import {expect, test} from '@playwright/test';

import {getClipboardContent} from '../../../utils/clipboard';
import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {QueryEditor} from './models/QueryEditor';

test.describe.only('Copy query result', () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Copy button copies result to clipboard', async ({page, context, browserName}) => {
        test.skip(browserName === 'webkit', 'Clipboard API not fully supported in Safari');
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery('SELECT 1 AS col1, 2 AS col2;');
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await queryEditor.clickCopyResultButton();
        await page.waitForTimeout(500);

        const clipboardText = await getClipboardContent(page);
        expect(clipboardText).toContain('col1');
        expect(clipboardText).toContain('col2');
        expect(clipboardText).toContain('1');
        expect(clipboardText).toContain('2');
    });
});
