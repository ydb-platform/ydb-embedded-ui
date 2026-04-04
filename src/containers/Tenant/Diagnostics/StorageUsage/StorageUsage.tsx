import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {useStorageGroupPath} from '../../../../routes';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {
    buildStorageUsageSections,
    normalizeMediaType,
    storageUsageApi,
} from '../../../../store/reducers/storageUsage/StorageUsage';
import type {
    StorageUsageGroupRow,
    StorageUsageMediaStatsByType,
} from '../../../../store/reducers/storageUsage/StorageUsage';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks';

import {StorageUsageSections} from './StorageUsageSections';
import {StorageUsageTable} from './StorageUsageTable';
import {STORAGE_USAGE_INITIAL_ROWS_COUNT} from './storageUsageFormatters';

export {formatOverhead, formatShare, getSharePercent} from './storageUsageFormatters';

import './StorageUsage.scss';

const b = cn('ydb-storage-usage');

const EMPTY_STORAGE_USAGE_ROWS: StorageUsageGroupRow[] = [];
const EMPTY_STORAGE_USAGE_MEDIA_STATS_BY_TYPE: StorageUsageMediaStatsByType = {};

interface StorageUsageProps {
    path: string;
    database: string;
    databaseFullPath: string;
}

interface VisibleRowsState {
    path: string;
    visibleRowsCount: number;
}

function StorageUsage({path, database, databaseFullPath}: StorageUsageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [visibleRowsState, setVisibleRowsState] = React.useState<VisibleRowsState>({
        path,
        visibleRowsCount: STORAGE_USAGE_INITIAL_ROWS_COUNT,
    });
    const useMetaProxy = useClusterWithProxy();
    const getStorageGroupPath = useStorageGroupPath();

    const {currentData: overviewData, error: overviewError} = overviewApi.useGetOverviewQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const {
        currentData: storageUsageData,
        isFetching: isStorageUsageFetching,
        error: storageUsageError,
    } = storageUsageApi.useGetStorageUsageQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isStorageUsageFetching && storageUsageData === undefined;
    const dataSize = overviewData?.PathDescription?.TableStats?.DataSize;
    const diskUsage = storageUsageData?.diskUsage;
    const mediaStatsByType =
        storageUsageData?.mediaStatsByType ?? EMPTY_STORAGE_USAGE_MEDIA_STATS_BY_TYPE;
    const rows = storageUsageData?.rows ?? EMPTY_STORAGE_USAGE_ROWS;
    const normalizedDataSize = Number(dataSize);
    const sectionDataSize =
        Number.isFinite(normalizedDataSize) && normalizedDataSize >= 0
            ? normalizedDataSize
            : undefined;

    const sections = React.useMemo(() => {
        return buildStorageUsageSections(rows, sectionDataSize, diskUsage || 0, mediaStatsByType);
    }, [rows, sectionDataSize, diskUsage, mediaStatsByType]);
    const hasMultipleMediaTypes = React.useMemo(() => {
        return new Set(rows.map((row) => normalizeMediaType(row.mediaType))).size > 1;
    }, [rows]);
    const visibleRowsCount =
        visibleRowsState.path === path
            ? visibleRowsState.visibleRowsCount
            : STORAGE_USAGE_INITIAL_ROWS_COUNT;
    const visibleRows = rows.slice(0, visibleRowsCount);
    const hiddenRowsCount = Math.max(rows.length - visibleRows.length, 0);
    const hasStorageUsageError = Boolean(storageUsageError && !storageUsageData);
    const handleShowMore = React.useCallback(() => {
        setVisibleRowsState((currentState) => {
            const currentVisibleRowsCount =
                currentState.path === path
                    ? currentState.visibleRowsCount
                    : STORAGE_USAGE_INITIAL_ROWS_COUNT;

            return {
                path,
                visibleRowsCount: currentVisibleRowsCount + STORAGE_USAGE_INITIAL_ROWS_COUNT,
            };
        });
    }, [path]);

    if (loading) {
        return <Loader size="m" />;
    }

    return (
        <Flex direction="column" gap={4} className={b()}>
            {hasStorageUsageError ? <ResponseError error={storageUsageError} /> : null}
            {overviewError ? <ResponseError error={overviewError} /> : null}
            {hasStorageUsageError ? null : (
                <React.Fragment>
                    <StorageUsageSections
                        hasMultipleMediaTypes={hasMultipleMediaTypes}
                        sections={sections}
                        isStorageUsageFetching={isStorageUsageFetching}
                    />
                    <StorageUsageTable
                        getStorageGroupPath={getStorageGroupPath}
                        hasMultipleMediaTypes={hasMultipleMediaTypes}
                        hiddenRowsCount={hiddenRowsCount}
                        onShowMore={handleShowMore}
                        rows={rows}
                        storageGroupsCount={storageUsageData?.storageGroupsCount}
                        visibleRows={visibleRows}
                    />
                </React.Fragment>
            )}
        </Flex>
    );
}

export {StorageUsage};
