import type {Page} from '@playwright/test';

import {NODE_ID, setupPDiskInfoMock, setupVDiskPageMocks} from './vdiskPageMocks';

export async function setupDatacenterDiskMocks(page: Page, theme: string, withNodeList = true) {
    await page.addInitScript((value) => {
        localStorage.setItem('theme', value);
        localStorage.setItem('enableNewStorageView', 'true');
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: 'VDisks', selected: true},
                {id: 'VDisksPDisks', selected: true},
            ]),
        );
    }, theme);
    await setupVDiskPageMocks(page, {datacenter: 'dc-a', host: 'dc-node', rack: 'rack-a'});
    await setupPDiskInfoMock(page);
    const location = {DataCenter: 'dc-a', BridgePileName: 'pile-a', Rack: 'rack-a'};
    const nodeListRequests: string[] = [];
    await page.route('**/viewer/json/nodelist?*', (route) => {
        nodeListRequests.push(route.request().url());
        return route.fulfill({
            json: withNodeList ? [{Id: Number(NODE_ID), Host: 'dc-node', Location: location}] : [],
        });
    });
    await page.route('**/viewer/json/sysinfo?*', (route) =>
        route.fulfill({
            json: {
                SystemStateInfo: [
                    {
                        NodeId: Number(NODE_ID),
                        Host: 'dc-node',
                        Roles: ['Storage'],
                        Location: location,
                    },
                ],
            },
        }),
    );
    return {nodeListRequests};
}
