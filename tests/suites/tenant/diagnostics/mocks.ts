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
 * Generates a mock row for the TopQueries table
 * @param index Row index (0-based)
 * @returns An array of values for each column
 */
const generateTopQueriesRow = (index: number) => {
    // Use a fixed base date for consistent results
    const baseDate = new Date('2025-06-06T12:00:00Z');

    // Generate end time in the past 6 hours (deterministic)
    const endTime = new Date(baseDate);
    endTime.setMinutes(endTime.getMinutes() - (index * 3 + (index % 30)));

    // Generate CPU time in microseconds (deterministic based on index)
    const cpuTimeUs = 1000 + ((index * 1000) % 99000);

    // Generate duration in microseconds (slightly higher than CPU time)
    const duration = cpuTimeUs + ((index * 500) % 50000);

    // Generate read bytes (deterministic)
    const readBytes = 100 + ((index * 100) % 9900);

    // Generate read rows (deterministic)
    const readRows = 1 + ((index * 10) % 999);

    // Generate request units (deterministic)
    const requestUnits = 1 + ((index * 2) % 49);

    // Generate rank
    const rank = index + 1;

    // Generate user SID
    const users = [
        'user@system',
        'admin@system',
        'service@system',
        'metadata@system',
        'test@system',
    ];
    const userSID = users[index % users.length];

    // Generate various query types
    const queryTemplates = [
        `SELECT * FROM \`//dev02/home/xenoxeno/db1/.metadata/initialization/migrations\`;`,
        `SELECT * FROM \`//dev02/home/xenoxeno/db1/.metadata/secrets/values\`;`,
        `--!syntax_v1\nDECLARE $c0_0 AS Uint64;\nDECLARE $c0_1 AS String;\nINSERT INTO \`kv_test\` (c0, c1) VALUES ($c0_0, $c0_1)`,
        `SELECT * FROM \`ydb/MasterClusterExt.db\`;\nSELECT version_str, color_class FROM \`ydb/MasterClusterVersions.db\`;`,
        `DECLARE $name AS Utf8;\nSELECT * FROM \`ydb/MasterClusterExt.db\` WHERE name=$name`,
        `SELECT COUNT(*) FROM \`big_kv_test\` WHERE id > 1000;`,
        `UPDATE \`boring_table\` SET value = 'updated' WHERE key = 'test';`,
        `SELECT a.*, b.* FROM \`cities\` a JOIN \`boring_table2\` b ON a.id = b.city_id;`,
        `INSERT INTO \`my_column_table\` (id, name, timestamp) VALUES (${index}, 'test_${index}', CurrentUtcTimestamp());`,
        `DELETE FROM \`my_row_table\` WHERE created_at < DateTime::MakeDate(DateTime::ParseIso8601('2024-01-01T00:00:00Z'));`,
    ];

    const queryText = queryTemplates[index % queryTemplates.length];

    return [
        cpuTimeUs, // CPUTimeUs
        queryText, // QueryText
        endTime.toISOString(), // IntervalEnd
        endTime.toISOString(), // EndTime
        readRows, // ReadRows
        readBytes, // ReadBytes
        userSID, // UserSID
        duration, // Duration
        requestUnits, // RequestUnits
        rank, // Rank
    ];
};

/**
 * Sets up a mock for the TopQueries tab with 100 rows for scrolling tests
 */
export const setupTopQueriesMock = async (page: Page) => {
    await page.route(`${backend}/viewer/json/query?*`, async (route) => {
        const request = route.request();
        const postData = request.postData();

        // Only mock TopQueries requests (check if it's a TopQueries query)
        if (postData && postData.includes('CPUTime as CPUTimeUs')) {
            await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

            // Generate 100 rows of data for scrolling test
            const rows = Array.from({length: 100}, (_, i) => generateTopQueriesRow(i));

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: 8,
                    result: [
                        {
                            rows: rows,
                            columns: [
                                {name: 'CPUTimeUs', type: 'Uint64?'},
                                {name: 'QueryText', type: 'Utf8?'},
                                {name: 'IntervalEnd', type: 'Timestamp?'},
                                {name: 'EndTime', type: 'Timestamp?'},
                                {name: 'ReadRows', type: 'Uint64?'},
                                {name: 'ReadBytes', type: 'Uint64?'},
                                {name: 'UserSID', type: 'Utf8?'},
                                {name: 'Duration', type: 'Uint64?'},
                                {name: 'RequestUnits', type: 'Uint64?'},
                                {name: 'Rank', type: 'Uint32?'},
                            ],
                        },
                    ],
                }),
            });
        } else {
            // Continue with the original request for other queries
            await route.continue();
        }
    });
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
