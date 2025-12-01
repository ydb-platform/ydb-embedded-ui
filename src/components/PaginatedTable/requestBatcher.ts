import type {FetchData, PaginatedTableData, SortParams} from './types';

interface PaginatedTableParams<T, F> {
    offset: number;
    fetchData: FetchData<T, F>;
    filters: F;
    limit: number;
    sortParams?: SortParams;
    columnsIds: string[];
    tableName: string;
}

interface QueuedRequest<T, F> {
    params: PaginatedTableParams<T, F>;
    resolve: (result: {data: PaginatedTableData<T>} | {error: unknown}) => void;
    reject: (error: unknown) => void;
    signal?: AbortSignal;
}

interface BatchGroup<T, F> {
    requests: QueuedRequest<T, F>[];
    batchKey: string;
    minOffset: number;
    maxOffset: number;
    totalLimit: number;
}

class RequestBatcher {
    private requestQueue = new Map<string, QueuedRequest<any, any>[]>();
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 50; // ms

    queueRequest<T, F>(
        params: PaginatedTableParams<T, F>,
        signal?: AbortSignal,
    ): Promise<{data: PaginatedTableData<T>} | {error: unknown}> {
        return new Promise((resolve, reject) => {
            const batchKey = this.createBatchKey(params);

            if (!this.requestQueue.has(batchKey)) {
                this.requestQueue.set(batchKey, []);
            }

            this.requestQueue.get(batchKey)!.push({
                params,
                resolve,
                reject,
                signal,
            });

            // Reset the batch timeout
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }

            this.batchTimeout = setTimeout(() => {
                this.processBatch();
            }, this.BATCH_DELAY);
        });
    }

    private createBatchKey<T, F>(params: PaginatedTableParams<T, F>): string {
        return JSON.stringify({
            tableName: params.tableName,
            filters: params.filters,
            sortParams: params.sortParams,
            columnsIds: params.columnsIds,
            limit: params.limit,
        });
    }

    private groupConsecutiveRequests<T, F>(requests: QueuedRequest<T, F>[]): BatchGroup<T, F>[] {
        if (requests.length === 0) {
            return [];
        }

        const sorted = requests.sort((a, b) => a.params.offset - b.params.offset);
        const groups: BatchGroup<T, F>[] = [];
        let currentGroup: QueuedRequest<T, F>[] = [sorted[0]];

        const limit = sorted[0].params.limit;

        for (let i = 1; i < sorted.length; i++) {
            const expectedOffset = currentGroup[currentGroup.length - 1].params.offset + limit;

            if (sorted[i].params.offset === expectedOffset) {
                // Consecutive request
                currentGroup.push(sorted[i]);
            } else {
                // Non-consecutive, create a new group
                groups.push(this.createBatchGroup(currentGroup));
                currentGroup = [sorted[i]];
            }
        }

        // Add the last group
        groups.push(this.createBatchGroup(currentGroup));

        return groups;
    }

    private createBatchGroup<T, F>(requests: QueuedRequest<T, F>[]): BatchGroup<T, F> {
        const minOffset = Math.min(...requests.map((r) => r.params.offset));
        const maxOffset = Math.max(...requests.map((r) => r.params.offset));
        const limit = requests[0].params.limit;
        const totalLimit = requests.length * limit;

        return {
            requests,
            batchKey: this.createBatchKey(requests[0].params),
            minOffset,
            maxOffset,
            totalLimit,
        };
    }

    private async executeBatch<T, F>(group: BatchGroup<T, F>): Promise<void> {
        const firstRequest = group.requests[0];
        const batchParams = {
            ...firstRequest.params,
            offset: group.minOffset,
            limit: group.totalLimit,
        };

        try {
            const response = await firstRequest.params.fetchData({
                limit: batchParams.limit,
                offset: batchParams.offset,
                filters: batchParams.filters,
                sortParams: batchParams.sortParams,
                columnsIds: batchParams.columnsIds,
                signal: firstRequest.signal,
            });

            // Split the response data among individual requests
            this.splitAndDistributeResponse(group, response);
        } catch (error) {
            // If batch fails, reject all requests in the group
            group.requests.forEach((request) => {
                request.resolve({error});
            });
        }
    }

    private splitAndDistributeResponse<T, F>(
        group: BatchGroup<T, F>,
        batchResponse: PaginatedTableData<T>,
    ): void {
        const limit = group.requests[0].params.limit;

        group.requests.forEach((request, index) => {
            const startIndex = index * limit;
            const endIndex = startIndex + limit;
            const chunkData = batchResponse.data.slice(startIndex, endIndex);

            const chunkResponse: PaginatedTableData<T> = {
                ...batchResponse,
                data: chunkData,
                total: batchResponse.total,
                found: batchResponse.found,
            };

            request.resolve({data: chunkResponse});
        });
    }

    private async processBatch(): Promise<void> {
        const allQueues = Array.from(this.requestQueue.entries());
        this.requestQueue.clear();
        this.batchTimeout = null;

        for (const [_batchKey, requests] of allQueues) {
            const groups = this.groupConsecutiveRequests(requests);

            // Execute each group (consecutive chunks) as a separate batch
            await Promise.all(groups.map((group) => this.executeBatch(group)));
        }
    }
}

// Singleton instance
export const requestBatcher = new RequestBatcher();
