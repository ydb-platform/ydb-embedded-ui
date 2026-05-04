import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {cn} from '../../../../../utils/cn';

import {TenantStorageMediaSectionView} from './TenantStorageSummarySections';
import {TenantStorageTopUsageTable} from './TenantStorageTopUsageTable';
import type {TenantStorageProps} from './types';
import {useTenantStorageNewData} from './useTenantStorageNewData';
import {buildTenantStorageMediaSections} from './utils';

import './TenantStorageNew.scss';

const b = cn('ydb-tenant-storage-new');

export function TenantStorageNew({
    database,
    databaseFullPath,
    metrics,
    blobStorageStats,
    tabletStorageStats,
}: TenantStorageProps) {
    const {currentData, data, error, isFetching} = useTenantStorageNewData({
        database,
        databaseFullPath,
        metrics,
    });
    const loading = isFetching && currentData === undefined;
    const mediaSections = React.useMemo(() => {
        return buildTenantStorageMediaSections({
            blobStorageStats,
            metrics,
            tabletStorageStats,
        });
    }, [blobStorageStats, metrics, tabletStorageStats]);

    if (error && !currentData) {
        return <ResponseError error={error} />;
    }

    const topRowsError = data.topRowsError ?? error;

    return (
        <LoaderWrapper loading={loading}>
            <Flex direction="column" gap={4} className={b()}>
                <div className={b('sections-group')}>
                    <div className={b('sections-inner')}>
                        {mediaSections.map((section, index) => (
                            <TenantStorageMediaSectionView
                                key={`${section.mediaType}-${index}`}
                                section={section}
                                showMediaTypeLabel={mediaSections.length > 1}
                                data={data}
                            />
                        ))}
                    </div>
                </div>
                <TenantStorageTopUsageTable
                    loading={loading}
                    error={topRowsError}
                    rows={data.topRows}
                    withData={Boolean(currentData)}
                />
            </Flex>
        </LoaderWrapper>
    );
}
