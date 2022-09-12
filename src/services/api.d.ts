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
        sendQuery: <
            Action extends import('../types/api/query').Actions,
            Schema extends import('../types/api/query').Schemas = undefined
        >(
            params: {
                query?: string,
                database?: string,
                action?: Action,
                stats?: string,
                schema?: Schema,
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/query').QueryAPIResponse<Action, Schema>>;
        [method: string]: Function;
    };
}
