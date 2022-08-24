interface Window {
    api: {
        getSchema: (
            params: {path: string},
            axiosOptions?: {concurrentId?: string},
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getStorageInfo: (
            params: {
                tenant: string,
                filter: string,
                nodeId: string,
                type: 'Groups' | 'Nodes',
            },
            axiosOptions?: {concurrentId?: string},
        ) => Promise<import('../types/api/storage').TStorageInfo>;
        [method: string]: Function;
    };
}
