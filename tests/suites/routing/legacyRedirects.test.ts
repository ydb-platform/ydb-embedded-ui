import {expect, test} from '@playwright/test';

test.describe('Legacy redirects', () => {
    test('redirects cluster tenants URL to databases tab', async ({page}) => {
        await page.goto('cluster/tenants?clusterName=my-cluster');

        await expect(page).toHaveURL(/\/cluster\/databases\?/);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/cluster/databases');
        expect(url.searchParams.get('clusterName')).toBe('my-cluster');
    });

    test('redirects tenant URL to database page', async ({page}) => {
        await page.goto('tenant?schema=%2Flocal&database=%2Flocal&tenantPage=diagnostics');

        await expect(page).toHaveURL(/\/database\?/);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/database');
        expect(url.searchParams.get('schema')).toBe('/local');
        expect(url.searchParams.get('database')).toBe('/local');
        expect(url.searchParams.get('databasePage')).toBe('diagnostics');
        expect(url.searchParams.has('tenantPage')).toBe(false);
    });
});
