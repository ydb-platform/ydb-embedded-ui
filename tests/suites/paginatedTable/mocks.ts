import type {Page} from '@playwright/test';

import {backend} from '../../utils/constants';

const MOCK_DELAY = 200; // 200ms delay to simulate network latency

interface NodeMockOptions {
    offset: number;
    limit: number;
}

export const generateNodeMock = async ({offset, limit}: NodeMockOptions) => {
    return Array.from({length: limit}, (_, i) => ({
        NodeId: offset + i + 1,
        SystemState: {
            Host: `host-${offset + i}.test`,
            DataCenter: `dc-${Math.floor((offset + i) / 10)}`,
            Rack: `rack-${Math.floor((offset + i) / 5)}`,
            Version: 'main.b7cfb36',
            StartTime: (Date.now() - 4 * 60 * 60 * 1000).toString(), // 4 hours ago
            LoadAverage: [0.1, 0.2, 0.3],
            NumberOfCpus: 8,
            SystemState: 'Green',
            MemoryUsed: ((8 + (i % 4)) * 1024 * 1024 * 1024).toString(), // 8-12GB
            MemoryLimit: (16 * 1024 * 1024 * 1024).toString(), // 16GB
            TotalSessions: 100,
            Tenants: ['local'],
        },
        CpuUsage: 10 + (i % 20),
        UptimeSeconds: 4 * 60 * 60, // 4 hours
        Disconnected: false,
        Tablets: [
            {
                TabletId: `tablet-${i}-1`,
                Type: 'DataShard',
                State: 'Active',
                Leader: true,
            },
            {
                TabletId: `tablet-${i}-2`,
                Type: 'DataShard',
                State: 'Active',
                Leader: false,
            },
        ],
    }));
};

export const setupNodesMock = async (page: Page) => {
    await page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
        const url = new URL(route.request().url());
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        const nodes = await generateNodeMock({offset, limit});

        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Overall: 'Green',
                Nodes: nodes,
                TotalNodes: '100',
                FoundNodes: '100',
            }),
        });
    });
};

export const setupEmptyNodesMock = async (page: Page) => {
    await page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Overall: 'Green',
                Nodes: [],
                TotalNodes: '0',
                FoundNodes: '0',
            }),
        });
    });
};

export const setupLargeNodesMock = async (page: Page, totalNodes = 1000) => {
    await page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
        const url = new URL(route.request().url());
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);

        // Generate nodes for the requested chunk
        const nodes = await generateNodeMock({
            offset,
            limit: Math.min(limit, totalNodes - offset), // Ensure we don't generate more than total
        });

        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Overall: 'Green',
                Nodes: nodes,
                TotalNodes: totalNodes.toString(),
                FoundNodes: totalNodes.toString(),
            }),
        });
    });
};
