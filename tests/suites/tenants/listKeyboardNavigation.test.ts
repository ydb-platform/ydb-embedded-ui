import {expect, test} from '@playwright/test';

import {TenantsPage} from './TenantsPage';

test('database arrows and Enter follow the displayed rows and preserve cluster scope', async ({
    page,
}) => {
    await page.route('**/viewer/json/tenantinfo?*', (route) =>
        route.fulfill({
            json: {
                TenantInfo: ['zulu', 'alpha', 'bravo'].map((name) => ({
                    Name: `/local/${name}`,
                    Cluster: 'keyboard-test',
                    Type: 'Dedicated',
                    State: 'RUNNING',
                })),
            },
        }),
    );
    const model = new TenantsPage(page);
    await model.goto({clusterName: 'keyboard-test'});
    const search = page.getByPlaceholder('Database name');
    await expect(page.getByRole('link', {name: 'alpha', exact: true})).toBeVisible();
    await search.press('ArrowUp');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('zulu');
    await search.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('alpha');
    await search.press('Enter');
    await expect(page).toHaveURL(/database=.*alpha/);
    expect(new URL(page.url()).searchParams.get('clusterName')).toBe('keyboard-test');
});
