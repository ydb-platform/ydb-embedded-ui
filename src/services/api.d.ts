type AxiosOptions = {
    concurrentId?: string;
};

interface Window {
    api: {
        getSchema: (
            params: {path: string},
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getStorageInfo: (
            params: {
                tenant: string,
                filter: string,
                nodeId: string,
                type: 'Groups' | 'Nodes',
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/storage').TStorageInfo>;
        sendQuery: <Schema extends 'modern' | 'classic' | 'ydb' | undefined = undefined>(
            params: {
                query?: string,
                database?: string,
                action?: string,
                stats?: string,
                schema?: Schema,
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/query').QueryResponse<Schema>>;
        [method: string]: Function;
    };
}
