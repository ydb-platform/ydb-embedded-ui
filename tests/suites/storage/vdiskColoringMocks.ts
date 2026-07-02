import type {Page} from '@playwright/test';

import {createMockStorageGroupsResponse} from './mockStorageGroups';

export const DATABASE = '/Root';

async function setupMonitoringUserMock(page: Page) {
    await page.route('**/viewer/json/whoami*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                UserID: 'e2e-vdisk-coloring-user',
                IsMonitoringAllowed: true,
                IsViewerAllowed: true,
            }),
        });
    });
}

async function setupCapabilitiesMock(page: Page) {
    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: DATABASE,
                Capabilities: {
                    '/storage/groups': 10,
                    '/viewer/nodes': 20,
                },
            }),
        });
    });
}

async function setupNodeInfoMock(page: Page) {
    await page.route('**/viewer/json/sysinfo?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                SystemStateInfo: [
                    {
                        NodeId: 7000,
                        Host: 'storage-node-01.ydb',
                        Roles: ['Storage'],
                        Location: {
                            Rack: 'Rack-1',
                            DataCenter: 'DC1',
                        },
                    },
                ],
            }),
        });
    });
}

export async function setupVDiskColoringMocks(page: Page) {
    await setupMonitoringUserMock(page);
    await setupCapabilitiesMock(page);
    await setupNodeInfoMock(page);

    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockStorageGroupsResponse()),
        });
    });
}
