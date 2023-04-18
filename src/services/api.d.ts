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
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/storage').TStorageInfo>;
        getNodes: (
            params: import('../types/store/nodes').INodesApiRequestParams,
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/nodes').TNodesInfo>;
        getCompute: (path: string) => Promise<import('../types/api/compute').TComputeInfo>;
        sendQuery: <
            Schema extends import('../types/api/query').Schemas,
            Action extends import('../types/api/query').Actions,
        >(
            params: {
                query?: string;
                database?: string;
                action?: Action;
                stats?: string;
                schema?: Schema;
            },
            axiosOptions?: AxiosOptions,
        ) => Promise<import('../types/api/query').QueryAPIResponse<Schema, Action>>;
        getExplainQuery: <Action extends import('../types/api/query').ExplainActions = 'explain'>(
            query: string,
            database: string,
            action?: Action,
        ) => Promise<import('../types/api/query').ExplainResponse<Action>>;
        getExplainQueryAst: (
            query: string,
            database: string,
        ) => Promise<import('../types/api/query').ExplainResponse<'explain-ast'>>;
        getHealthcheckInfo: (
            database: string,
        ) => Promise<import('../types/api/healthcheck').HealthCheckAPIResponse>;
        getTenantInfo: (params: {
            path: string;
        }) => Promise<import('../types/api/tenant').TTenantInfo>;
        getClusterInfo: () => Promise<import('../types/api/cluster').TClusterInfo>;
        getTabletsInfo: (params: {
            nodes?: string[];
            path?: string;
        }) => Promise<import('../types/api/tablet').TEvTabletStateResponse>;
        getTabletDescribe: (
            tenantId?: import('../types/api/tablet').TDomainKey,
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getTablet: (params: {
            id?: string;
        }) => Promise<import('../types/api/tablet').TEvTabletStateResponse>;
        getTabletHistory: (params: {
            id?: string;
        }) => Promise<import('../types/api/tablet').UnmergedTEvTabletStateResponse>;
        getHeatmapData: (params: {
            path: string;
        }) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        getTopic: (params: {
            path?: string;
        }) => Promise<import('../types/api/topic').DescribeTopicResult>;
        getConsumer: (params: {
            path?: string;
            consumer?: string;
        }) => Promise<import('../types/api/consumer').DescribeConsumerResult>;
        getHostInfo: () => Promise<import('../types/api/systemState').TEvSystemStateResponse>;
        getNodeInfo: (
            id?: string,
        ) => Promise<import('../types/api/systemState').TEvSystemStateResponse>;
        getNodesList: () => Promise<import('../types/api/nodesList').TEvNodesInfo>;
        [method: string]: Function;
    };
}
