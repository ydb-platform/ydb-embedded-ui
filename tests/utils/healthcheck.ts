import type {Page} from '@playwright/test';

import {database} from './constants';

export async function mockHealthcheckWithIssue(page: Page) {
    await page.route('**/viewer/json/healthcheck**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
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
            }),
        });
    });
}
