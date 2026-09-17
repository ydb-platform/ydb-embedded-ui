import type {Page} from '@playwright/test';

import {EFlag} from '../../../src/types/api/enums';
import type {TNodeInfo, TNodesInfo} from '../../../src/types/api/nodes';
import {TPDiskState} from '../../../src/types/api/pdisk';
import type {TPDiskStateInfo} from '../../../src/types/api/pdisk';
import {EVDiskState} from '../../../src/types/api/vdisk';
import type {TVDiskStateInfo} from '../../../src/types/api/vdisk';

export async function setupPDiskPreviewMocks(page: Page, nodeCount = 1, disksPerNode = 1) {
    const nodes = Array.from({length: nodeCount}, (_node, index) => {
        const nodeId = index + 1;
        const pDisks: TPDiskStateInfo[] = Array.from(
            {length: disksPerNode},
            (_disk, diskIndex) => ({
                NodeId: nodeId,
                PDiskId: diskIndex + 1,
                Path: `/dev/test-${diskIndex + 1}`,
                Category: '1',
                State: TPDiskState.Normal,
                TotalSize: '1000000000',
                AvailableSize: '500000000',
            }),
        );
        const vDisks: TVDiskStateInfo[] = pDisks.flatMap((pDisk, diskIndex) =>
            Array.from({length: 12}, (_slot, slotIndex) => ({
                NodeId: nodeId,
                PDiskId: pDisk.PDiskId,
                VDiskSlotId: slotIndex + 1,
                VDiskId: {
                    GroupID: diskIndex * 12 + slotIndex + 1,
                    GroupGeneration: 1,
                    Ring: 0,
                    Domain: 0,
                    VDisk: 0,
                },
                VDiskState: EVDiskState.OK,
                Replicated: true,
                AllocatedSize: '1000000',
                AvailableSize: '1000000',
            })),
        );
        return {
            NodeId: nodeId,
            SystemState: {
                NodeId: nodeId,
                Host: `preview-node-${nodeId}`,
                SystemState: EFlag.Green,
                Version: 'test',
            },
            PDisks: pDisks,
            VDisks: vDisks,
        } satisfies TNodeInfo;
    });
    const settings: Record<string, string> = {};
    await page.route(/\/viewer\/|\/meta\//, async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/nodes')) {
            const offset = Number(url.searchParams.get('offset') ?? 0);
            const limit = Number(url.searchParams.get('limit') ?? nodeCount);
            json = {
                TotalNodes: String(nodeCount),
                FoundNodes: String(nodeCount),
                MaximumSlotsPerDisk: '12',
                MaximumDisksPerNode: String(disksPerNode),
                Nodes: nodes.slice(offset, offset + limit),
            } satisfies TNodesInfo;
        } else if (url.pathname.endsWith('/nodelist')) {
            json = nodes.map(({SystemState}) => SystemState);
        } else if (url.pathname.endsWith('/whoami')) {
            json = {
                UserSID: 'preview-test',
                IsViewerAllowed: true,
                IsMonitoringAllowed: true,
                IsAdministrationAllowed: true,
            };
        } else if (url.pathname.endsWith('/capabilities')) {
            json = {Capabilities: {'/viewer/json/nodes': 1}};
        } else if (url.pathname.endsWith('/cluster')) {
            json = {Name: 'preview test', Overall: EFlag.Green, Nodes: nodeCount};
        } else if (url.pathname.endsWith('/tenantinfo')) {
            json = {TenantInfo: []};
        } else if (url.pathname.endsWith('/get_user_settings')) {
            json = settings;
        } else if (url.pathname.endsWith('/user_settings')) {
            const name = url.searchParams.get('name') ?? '';
            if (route.request().method() === 'POST') {
                settings[name] = route.request().postDataJSON();
                json = {status: 'SUCCESS'};
            } else {
                json = settings[name] ?? null;
            }
        }
        await route.fulfill({json});
    });
    return nodes;
}
