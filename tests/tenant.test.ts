import {test, expect} from '@playwright/test';

test.describe('Test Tenants page', async () => {
    test('Tenants page is OK', async ({page}) => {
        const response = await page.goto('/tenants');
        expect(response?.ok()).toBe(true);
    });
    test('Tenants page has tenants table', async ({page}) => {
        await page.goto('/tenants');

        // react-data-table has 2 table elements - for header and for the content
        // so we select content table that is wrapped with .data-table__box
        await expect(page.locator('.data-table__box').getByRole('table')).toBeVisible();
    });
});
