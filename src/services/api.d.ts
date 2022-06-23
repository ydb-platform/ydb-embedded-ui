interface Window {
    api: {
        getSchema: (
            params: {path: string},
            axiosOptions?: {concurrentId?: string},
        ) => Promise<import('../types/api/schema').TEvDescribeSchemeResult>;
        [method: string]: Function;
    };
}
