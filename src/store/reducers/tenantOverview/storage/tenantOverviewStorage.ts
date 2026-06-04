import type {AxiosOptions} from '../../../../services/api/base';
import type {EPathSubType, EPathType, TEvDescribeSchemeResult} from '../../../../types/api/schema';
import type {
    StorageStatsResponse,
    TStorageStatsPathEntry,
    TStorageStatsTabletTypeEntry,
} from '../../../../types/api/storage';
import {QUERY_TECHNICAL_MARK} from '../../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../../utils/query';
import {parseNonNegativeNumber, parseOptionalNonNegativeNumber} from '../../../../utils/utils';
import {api} from '../../api';

export interface TenantStorageRawTopRow {
    path: string;
    userData: number;
    physicalDisk?: number;
    pathType?: EPathType;
    pathSubType?: EPathSubType;
}

export interface TenantStorageRawData {
    logicalUserData?: {
        rowTables?: number;
        topics?: number;
    };
    topRows: TenantStorageRawTopRow[];
    topRowsError?: unknown;
    tabletTypeRows: TStorageStatsTabletTypeEntry[];
}

export interface GetTenantStorageRawParams {
    database: string;
    databaseFullPath: string;
    useMetaProxy?: boolean;
}

const TOP_STORAGE_OBJECTS_LIMIT = 10;

function getTopStorageObjectsQuery() {
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Path,
    SUM(DataSize) AS UserData
FROM \`.sys/partition_stats\`
WHERE TabletId != 0
GROUP BY Path
ORDER BY UserData DESC
LIMIT ${TOP_STORAGE_OBJECTS_LIMIT}
`;
}

function normalizeNumericValue(value: number | string | undefined) {
    return parseNonNegativeNumber(value);
}

function toOptionalNumericValue(value: number | string | undefined) {
    return parseOptionalNonNegativeNumber(value, {emptyStringAsUndefined: true});
}

function getAbsolutePath({
    fullPath,
    path,
    databaseFullPath,
    useMetaProxy,
}: {
    fullPath?: string;
    path?: string;
    databaseFullPath: string;
    useMetaProxy?: boolean;
}) {
    if (typeof fullPath === 'string' && fullPath) {
        return fullPath;
    }

    if (typeof path !== 'string') {
        return undefined;
    }

    if (path.startsWith('/')) {
        return path;
    }

    if (!useMetaProxy) {
        return path || undefined;
    }

    if (!path) {
        return databaseFullPath;
    }

    return `${databaseFullPath}/${path}`;
}

function joinSchemaPath(parentPath: string, childName: string) {
    if (parentPath === '/') {
        return `/${childName}`;
    }

    return `${parentPath}/${childName}`;
}

function normalizeStorageStatsPath(path: string, databaseFullPath: string, useMetaProxy?: boolean) {
    if (!useMetaProxy) {
        return path;
    }

    if (path === databaseFullPath) {
        return '';
    }

    if (path.startsWith(databaseFullPath + '/')) {
        return path.slice(databaseFullPath.length + 1);
    }

    return path;
}

function buildMultiPathStorageStatsParam(
    paths: string[],
    databaseFullPath: string,
    useMetaProxy?: boolean,
) {
    return paths
        .map((path) => normalizeStorageStatsPath(path, databaseFullPath, useMetaProxy))
        .join(',');
}

async function getTopRowsByQuery(
    {database}: Pick<GetTenantStorageRawParams, 'database'>,
    options?: AxiosOptions,
) {
    const response = await window.api.viewer.sendQuery(
        {
            query: getTopStorageObjectsQuery(),
            database,
            action: 'execute-query',
            internal_call: true,
        },
        {...options, withRetries: true},
    );

    if (isQueryErrorResponse(response)) {
        throw response;
    }

    const rows = parseQueryAPIResponse(response).resultSets?.[0]?.result ?? [];

    return rows
        .filter((row): row is {Path?: string; UserData?: string | number} => {
            return Boolean(row && typeof row === 'object');
        })
        .map((row) => {
            const path = typeof row.Path === 'string' ? row.Path : undefined;

            if (!path) {
                return undefined;
            }

            return {
                path,
                userData: normalizeNumericValue(row.UserData),
            };
        })
        .filter((row): row is Pick<TenantStorageRawTopRow, 'path' | 'userData'> => {
            return row !== undefined;
        });
}

function getLogicalUserData(schemaResponse: TEvDescribeSchemeResult | null | undefined) {
    const diskSpaceUsage = schemaResponse?.PathDescription?.DomainDescription?.DiskSpaceUsage;
    const tablesDataSize = toOptionalNumericValue(diskSpaceUsage?.Tables?.DataSize);
    const topicsDataSize = toOptionalNumericValue(diskSpaceUsage?.Topics?.DataSize);

    if (tablesDataSize === undefined && topicsDataSize === undefined) {
        return undefined;
    }

    return {
        rowTables: tablesDataSize,
        topics: topicsDataSize,
    };
}

async function getRootSchemaData(
    {database, databaseFullPath, useMetaProxy}: GetTenantStorageRawParams,
    options?: AxiosOptions,
) {
    const result = new Map<string, Pick<TenantStorageRawTopRow, 'pathType' | 'pathSubType'>>();

    try {
        const rootSchema = await window.api.viewer.getSchema(
            {
                database,
                path: {path: databaseFullPath, databaseFullPath, useMetaProxy},
            },
            options,
        );

        const rootPath =
            getAbsolutePath({
                fullPath: rootSchema?.Path,
                databaseFullPath,
                useMetaProxy,
            }) ?? databaseFullPath;

        const rootChildren = rootSchema?.PathDescription?.Children ?? [];

        for (const child of rootChildren) {
            const {Name, PathType, PathSubType} = child;

            if (!Name) {
                continue;
            }

            result.set(joinSchemaPath(rootPath, Name), {
                pathType: PathType,
                pathSubType: PathSubType,
            });
        }

        return {
            logicalUserData: getLogicalUserData(rootSchema),
            topRowTypes: result,
        };
    } catch {
        return {
            logicalUserData: undefined,
            topRowTypes: result,
        };
    }
}

async function getTopRowTypes(
    rows: TenantStorageRawTopRow[],
    {database, databaseFullPath, useMetaProxy}: GetTenantStorageRawParams,
    initialTypes: Map<string, Pick<TenantStorageRawTopRow, 'pathType' | 'pathSubType'>>,
    options?: AxiosOptions,
) {
    const result = new Map(initialTypes);

    const missingPaths = rows.map(({path}) => path).filter((path) => !result.has(path));

    const uniqueMissingPaths = Array.from(new Set(missingPaths));

    if (uniqueMissingPaths.length === 0) {
        return {
            topRowTypes: result,
            error: undefined,
        };
    }

    const responses = await Promise.allSettled(
        uniqueMissingPaths.map((path) =>
            window.api.viewer.getSchema(
                {
                    database,
                    path: {path, databaseFullPath, useMetaProxy},
                },
                options,
            ),
        ),
    );

    const firstError = responses.find(
        (response): response is PromiseRejectedResult => response.status === 'rejected',
    )?.reason;

    responses.forEach((response, index) => {
        if (response.status !== 'fulfilled') {
            return;
        }

        const path = uniqueMissingPaths[index];
        const self = response.value?.PathDescription?.Self;

        result.set(path, {
            pathType: self?.PathType,
            pathSubType: self?.PathSubType,
        });
    });

    return {
        topRowTypes: result,
        error: firstError,
    };
}

function getStorageStatsByPath(response: StorageStatsResponse, params: GetTenantStorageRawParams) {
    const {databaseFullPath, useMetaProxy} = params;
    const rows = response.Paths ?? [];

    return rows.reduce<Map<string, number>>((result, row: TStorageStatsPathEntry) => {
        const path = getAbsolutePath({
            fullPath: row.FullPath,
            path: row.Path,
            databaseFullPath,
            useMetaProxy,
        });

        if (!path) {
            return result;
        }

        result.set(path, normalizeNumericValue(row.StorageSize));

        return result;
    }, new Map());
}

async function getStorageStatsForTopRows(
    paths: string[],
    params: GetTenantStorageRawParams,
    options?: AxiosOptions,
) {
    const {database, databaseFullPath, useMetaProxy} = params;

    if (paths.length === 0) {
        return new Map<string, number>();
    }

    const response = await window.api.viewer.getStorageStats(
        {
            database,
            path: {
                path: buildMultiPathStorageStatsParam(paths, databaseFullPath, useMetaProxy),
                databaseFullPath,
                useMetaProxy,
            },
            groupBy: 'path',
        },
        options,
    );

    return getStorageStatsByPath(response, params);
}

function mergeTopRows(
    queryRows: Array<Pick<TenantStorageRawTopRow, 'path' | 'userData'>>,
    topRowTypes: Map<string, Pick<TenantStorageRawTopRow, 'pathType' | 'pathSubType'>>,
    storageStatsByPath: Map<string, number>,
) {
    return queryRows.map((row) => {
        return {
            ...row,
            physicalDisk: storageStatsByPath.get(row.path),
            ...topRowTypes.get(row.path),
        };
    });
}

export async function fetchTenantStorageRawData(
    params: GetTenantStorageRawParams,
    options?: AxiosOptions,
) {
    const {database} = params;

    const [tabletTypeResult, topRowsResult, rootSchemaData] = await Promise.all([
        window.api.viewer
            .getStorageStats(
                {
                    database,
                    groupBy: 'tablet_type',
                    tablets: true,
                    media: true,
                },
                options,
            )
            .then((response) => ({
                tabletTypeRows: response.Tablets ?? [],
                error: undefined,
            }))
            .catch((error: unknown) => ({
                tabletTypeRows: [] as TStorageStatsTabletTypeEntry[],
                error,
            })),
        getTopRowsByQuery(params, options)
            .then((rows) => ({rows, error: undefined}))
            .catch((error: unknown) => ({rows: [], error})),
        getRootSchemaData(params, options),
    ]);
    const queryTopRows = topRowsResult.rows;

    const storageStatsResult = await getStorageStatsForTopRows(
        queryTopRows.map(({path}) => path),
        params,
        options,
    )
        .then((storageStatsByPath) => ({storageStatsByPath, error: undefined}))
        .catch((error: unknown) => ({storageStatsByPath: new Map<string, number>(), error}));
    const storageStatsByPath = storageStatsResult.storageStatsByPath;
    const topRowsWithoutTypes = queryTopRows.map((row) => ({
        ...row,
        physicalDisk: storageStatsByPath.get(row.path),
    }));
    const initialTopRowTypes = rootSchemaData?.topRowTypes ?? new Map();
    const topRowTypesResult = await getTopRowTypes(
        topRowsWithoutTypes,
        params,
        initialTopRowTypes,
        options,
    ).catch((error: unknown) => ({topRowTypes: initialTopRowTypes, error}));
    const enrichmentError = storageStatsResult.error ?? topRowTypesResult.error;

    return {
        logicalUserData: rootSchemaData?.logicalUserData,
        topRows: mergeTopRows(queryTopRows, topRowTypesResult.topRowTypes, storageStatsByPath),
        topRowsError: topRowsResult.error ?? enrichmentError ?? tabletTypeResult.error,
        tabletTypeRows: tabletTypeResult.tabletTypeRows,
    };
}

export const tenantOverviewStorageApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTenantStorageRawData: build.query<TenantStorageRawData, GetTenantStorageRawParams>({
            queryFn: async (params, {signal}) => {
                try {
                    const data = await fetchTenantStorageRawData(params, {signal});

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {database, databaseFullPath, useMetaProxy} = queryArgs;

                return {database, databaseFullPath, useMetaProxy};
            },
            keepUnusedDataFor: 0,
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
