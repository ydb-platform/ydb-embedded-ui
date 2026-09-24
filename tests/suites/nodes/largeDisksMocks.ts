import type {Page} from '@playwright/test';

import {generateNodeMock} from '../paginatedTable/mocks';

export async function setupLargeDisksMock(
    page: Page,
    totalNodes = 200,
    {pDisksPerNode = 66, vDisksPerPDisk = 10} = {},
) {
    let reverseDisks = false;
    let disksPresent = true;
    await page.addInitScript(() => {
        localStorage.setItem(
            'nodesTableSelectedColumns',
            JSON.stringify(['NodeId', 'Host', 'PDisks']),
        );
    });
    await page.route('**/viewer/json/whoami*', (route) =>
        route.fulfill({
            json: {UserID: 'nodes-test', IsMonitoringAllowed: true, IsViewerAllowed: true},
        }),
    );
    await page.route('**/viewer/capabilities*', (route) =>
        route.fulfill({json: {Capabilities: {'/viewer/nodes': 20}}}),
    );
    await page.route('**/viewer/json/nodes?*', async (route) => {
        const url = new URL(route.request().url());
        const offset = Number(url.searchParams.get('offset') || 0);
        const limit = Math.min(Number(url.searchParams.get('limit') || 20), totalNodes - offset);
        const nodes = await generateNodeMock({offset, limit});

        await route.fulfill({
            json: {
                TotalNodes: String(totalNodes),
                FoundNodes: String(totalNodes),
                MaximumDisksPerNode: String(pDisksPerNode),
                MaximumSlotsPerDisk: String(vDisksPerPDisk),
                Nodes: nodes.map((node) => ({
                    ...node,
                    PDisks: Array.from({length: disksPresent ? pDisksPerNode : 0}, (_, index) => {
                        const pDiskId = reverseDisks ? pDisksPerNode - index : index + 1;
                        return {
                            NodeId: node.NodeId,
                            PDiskId: pDiskId,
                            Path: `/dev/disk-${pDiskId}`,
                            State: 'Normal',
                            TotalSize: '1000000000',
                            AvailableSize: '500000000',
                        };
                    }),
                    VDisks: Array.from(
                        {length: disksPresent ? pDisksPerNode * vDisksPerPDisk : 0},
                        (_, index) => ({
                            NodeId: node.NodeId,
                            PDiskId: Math.floor(index / vDisksPerPDisk) + 1,
                            VDiskId: {
                                GroupID: node.NodeId * 1000 + index,
                                GroupGeneration: 1,
                                Ring: 0,
                                Domain: 0,
                                VDisk: 0,
                            },
                            VDiskSlotId: index % vDisksPerPDisk,
                            VDiskState: 'OK',
                            DiskSpace: 'Green',
                            Replicated: true,
                            AllocatedSize: '50000000',
                            AvailableSize: '50000000',
                        }),
                    ),
                })),
            },
        });
    });
    return {
        setDisksPresent: (present: boolean) => {
            disksPresent = present;
        },
        reversePDisks: () => {
            reverseDisks = true;
        },
    };
}
