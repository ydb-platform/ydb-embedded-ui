import type {Page} from '@playwright/test';

import {backend} from '../../../../utils/constants';

interface Operation {
    ready: boolean;
    metadata: {
        description?: any;
        settings?: any;
        progress: number;
        '@type': string;
        state: string;
    };
    status: string;
    create_time: {
        seconds: string;
    };
    end_time?: {
        seconds: string;
    };
    id: string;
    issues?: Array<{
        severity: number;
        message: string;
    }>;
    created_by?: string;
}

const MOCK_DELAY = 200; // 200ms delay to simulate network latency

interface OperationMockOptions {
    totalOperations?: number;
    pageSize?: number;
}

const generateBuildIndexOperations = (start: number, count: number): Operation[] => {
    const now = Math.floor(Date.now() / 1000);
    return Array.from({length: count}, (_, i) => {
        const index = start + i;
        const createTime = now - (index + 1) * 60; // Created minutes ago
        const endTime = createTime + 30; // Completed after 30 seconds

        return {
            ready: true,
            metadata: {
                description: {
                    index: {
                        name: `index_${index}`,
                        global_index: {},
                        index_columns: [`column_${index}`],
                    },
                    path: `/dev02/home/testuser/db1/table_${index}`,
                },
                progress: 100,
                '@type': 'type.googleapis.com/Ydb.Table.IndexBuildMetadata',
                state: 'STATE_DONE',
            },
            status: 'SUCCESS',
            end_time: {
                seconds: endTime.toString(),
            },
            create_time: {
                seconds: createTime.toString(),
            },
            id: `ydb://buildindex/7?id=56300033048${8000 + index}`,
            ...(index % 3 === 0
                ? {
                      issues: [
                          {
                              severity: 1,
                              message: `TShardStatus { ShardIdx: 72075186224037897:${100 + index} Status: DONE UploadStatus: STATUS_CODE_UNSPECIFIED DebugMessage: <main>: Error: Shard or requested range is empty\n SeqNoRound: 1 Processed: { upload rows: 0, upload bytes: 0, read rows: 0, read bytes: 0 } }`,
                          },
                      ],
                  }
                : {}),
        };
    });
};

const generateExportOperations = (start: number, count: number): Operation[] => {
    const now = Math.floor(Date.now() / 1000);
    return Array.from({length: count}, (_, i) => {
        const index = start + i;
        const createTime = now - (index + 1) * 120; // Created 2 minutes ago each
        const isCompleted = index % 2 === 0;

        return {
            ready: isCompleted,
            metadata: {
                settings: {
                    export_s3_settings: {
                        bucket: `export-bucket-${index}`,
                        endpoint: 'https://s3.amazonaws.com',
                        number_of_retries: 3,
                        scheme: 'HTTPS',
                    },
                },
                progress: isCompleted ? 100 : 30 + (index % 7) * 10,
                '@type': 'type.googleapis.com/Ydb.Export.ExportToS3Metadata',
                state: isCompleted ? 'STATE_DONE' : 'STATE_IN_PROGRESS',
            },
            status: isCompleted ? 'SUCCESS' : 'GENERIC_ERROR',
            create_time: {
                seconds: createTime.toString(),
            },
            ...(isCompleted
                ? {
                      end_time: {
                          seconds: (createTime + 60).toString(),
                      },
                  }
                : {}),
            id: `ydb://export/s3/7?id=56300033048${9000 + index}`,
            created_by: `user${index % 3}@example.com`,
        };
    });
};

export const setupOperationsMock = async (page: Page, options?: OperationMockOptions) => {
    const totalOperations = options?.totalOperations || 100;

    await page.route(`${backend}/operation/list*`, async (route) => {
        const url = new URL(route.request().url());
        const params = Object.fromEntries(url.searchParams);

        const requestedPageSize = parseInt(params.page_size || '10', 10);
        const pageToken = params.page_token;
        const kind = params.kind || 'buildindex';

        // Calculate page index from token
        const pageIndex = pageToken ? parseInt(pageToken, 10) : 0;
        const start = pageIndex * requestedPageSize;
        const remainingOperations = Math.max(0, totalOperations - start);
        const count = Math.min(requestedPageSize, remainingOperations);

        let operations: Operation[] = [];
        if (kind === 'buildindex') {
            operations = generateBuildIndexOperations(start, count);
        } else if (kind === 'export/s3') {
            operations = generateExportOperations(start, count);
        } else {
            operations = []; // Empty for other kinds
        }

        // Calculate next page token
        const hasMorePages = start + count < totalOperations;
        const nextPageToken = hasMorePages ? (pageIndex + 1).toString() : '0';

        const response = {
            next_page_token: nextPageToken,
            status: 'SUCCESS',
            operations,
        };

        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
};

export const setupEmptyOperationsMock = async (page: Page) => {
    await page.route(`${backend}/operation/list*`, async (route) => {
        const response = {
            next_page_token: '0',
            status: 'SUCCESS',
            operations: [],
        };

        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
};

export const setupLargeOperationsMock = async (page: Page, totalOperations = 1000) => {
    await setupOperationsMock(page, {totalOperations});
};

export const setupOperationMutationMocks = async (page: Page) => {
    // Mock cancel operation
    await page.route(`${backend}/operation/cancel*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'SUCCESS',
            }),
        });
    });

    // Mock forget operation
    await page.route(`${backend}/operation/forget*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'SUCCESS',
            }),
        });
    });
};

export const setupOperationErrorMock = async (page: Page) => {
    await page.route(`${backend}/operation/list*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
                error: 'Internal server error',
            }),
        });
    });
};

export const setupOperation403Mock = async (page: Page) => {
    await page.route(`${backend}/operation/list*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

        await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
                error: 'Forbidden',
            }),
        });
    });
};

// Helper to setup all required mocks for operations
export const setupAllOperationMocks = async (page: Page, options?: {totalOperations?: number}) => {
    await setupOperationsMock(page, options);
    await setupOperationMutationMocks(page);
};
