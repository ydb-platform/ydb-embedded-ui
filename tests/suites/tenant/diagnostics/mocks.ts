import type {Page} from '@playwright/test';

import {backend} from '../../../utils/constants';

const MOCK_DELAY = 200; // 200ms delay to simulate network latency

/**
 * Generates a mock row for the TopShards table in History mode
 * @param index Row index (0-based)
 * @returns An array of values for each column
 */
const generateTopShardsHistoryRow = (index: number) => {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);
    endTime.setMinutes(0);
    endTime.setSeconds(0);
    endTime.setMilliseconds(0);

    // Calculate a peak time somewhere in the past hour
    const peakTime = new Date(now);
    peakTime.setMinutes(peakTime.getMinutes() - (index * 5 + Math.floor(Math.random() * 15)));

    // Generate a CPU usage between 0.85 and 0.98
    const cpuCores = 0.85 + Math.random() * 0.13;

    // Generate a data size between 1GB and 2GB (in bytes)
    const dataSize = Math.floor(1000000000 + Math.random() * 1000000000).toString();

    // Generate row count (30-60 million rows)
    const rowCount = Math.floor(30000000 + Math.random() * 30000000).toString();

    // Generate index size (approximately 8-15% of data size)
    const indexSize = Math.floor(parseInt(dataSize) * (0.08 + Math.random() * 0.07)).toString();

    // NodeId between 50000 and 50020
    const nodeId = 50000 + Math.floor(Math.random() * 20);

    // In-flight transactions (usually low, 0-3)
    const inFlightTxCount = Math.floor(Math.random() * 4);

    // Generate unique tablet ID
    const tabletId = `7207518622${100000 + index}`;

    // Generate paths
    const dbIndex = Math.floor(index / 3) + 1;
    const relativePath = `/db${dbIndex}/shard_${index + 1}`;
    const fullPath = `/dev01/home/ydbuser${relativePath}`;

    return [
        cpuCores, // CPUCores
        dataSize, // DataSize
        0, // FollowerId
        inFlightTxCount, // InFlightTxCount
        indexSize, // IndexSize
        endTime.toISOString(), // IntervalEnd
        nodeId, // NodeId
        fullPath, // Path
        peakTime.toISOString(), // PeakTime
        index + 1, // Rank
        relativePath, // RelativePath
        rowCount, // RowCount
        tabletId, // TabletId
    ];
};

/**
 * Sets up a mock for the TopShards tab in History mode
 * This ensures the first row has values for all columns
 */
export const setupTopShardsHistoryMock = async (page: Page) => {
    await page.route(`${backend}/viewer/json/query?*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        // Generate 10 rows of data
        const rows = Array.from({length: 10}, (_, i) => generateTopShardsHistoryRow(i));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                version: 8,
                result: [
                    {
                        rows: rows,
                        columns: [
                            {name: 'CPUCores', type: 'Double?'},
                            {name: 'DataSize', type: 'Uint64?'},
                            {name: 'FollowerId', type: 'Uint32?'},
                            {name: 'InFlightTxCount', type: 'Uint32?'},
                            {name: 'IndexSize', type: 'Uint64?'},
                            {name: 'IntervalEnd', type: 'Timestamp?'},
                            {name: 'NodeId', type: 'Uint32?'},
                            {name: 'Path', type: 'Utf8?'},
                            {name: 'PeakTime', type: 'Timestamp?'},
                            {name: 'Rank', type: 'Uint32?'},
                            {name: 'RelativePath', type: 'Utf8?'},
                            {name: 'RowCount', type: 'Uint64?'},
                            {name: 'TabletId', type: 'Uint64?'},
                        ],
                    },
                ],
            }),
        });
    });
};
