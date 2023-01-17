type AxiosOptions = {
    concurrentId?: string;
};

interface Window {
    api: {
        getSchema: (
            params: {path: string},
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getDescribe: (
            params: {path: string},
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getStorageInfo: (
            params: {
                tenant: string;
                filter: string;
                nodeId: string;
                type: 'Groups' | 'Nodes';
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/storage').TStorageInfo>;
        sendQuery: <
            Action extends import('../types/api/query').Actions,
            Schema extends import('../types/api/query').Schemas = undefined,
        >(
            params: {
                query?: string;
                database?: string;
                action?: Action;
                stats?: string;
                schema?: Schema;
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/query').QueryAPIResponse<Action, Schema>>;
        getExplainQuery: (
            query: string,
            database: string,
        ) => Promise<import('../types/api/query').QueryAPIExplainResponse<'explain'>>;
        getExplainQueryAst: (
            query: string,
            database: string,
        ) => Promise<import('../types/api/query').QueryAPIExplainResponse<'explain-ast'>>;
        getHealthcheckInfo: (
            database: string,
        ) => Promise<import('../types/api/healthcheck').HealthCheckAPIResponse>;
        getTenantInfo: (params: {
            path: string;
        }) => Promise<import('../types/api/tenant').TTenantInfo>;
        getTabletsInfo: (params: {
            nodes?: string[];
            path?: string;
        }) => Promise<import('../types/api/tablet').TEvTabletStateResponse>;
        getHeatmapData: (params: {
            path: string;
        }) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getTopic: (params: {
            path?: string;
        }) => Promise<import('../types/api/topic').DescribeTopicResult>;
        [method: string]: Function;
    };
}
