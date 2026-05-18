import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Skeleton} from '../../../../../components/Skeleton/Skeleton';
import {cn} from '../../../../../utils/cn';

import {
    TenantStorageGroupedMediaSectionsView,
    TenantStorageMediaSectionView,
} from './TenantStorageSummarySections';
import {TenantStorageTopUsageTable} from './TenantStorageTopUsageTable';
import type {TenantStorageProps} from './types';
import {useTenantStorageNewData} from './useTenantStorageNewData';
import {buildTenantStorageMediaSections} from './utils';

import './TenantStorageNew.scss';

const b = cn('ydb-tenant-storage-new');

function TenantStorageSummarySkeleton() {
    return (
        <Flex direction="column" className={b('sections-group')}>
            <Flex direction="column" gap={3} className={b('sections-inner')}>
                {[0, 1].map((cardIndex) => (
                    <Flex
                        key={cardIndex}
                        direction="column"
                        gap={3}
                        className={b('summary-skeleton-card')}
                    >
                        <Skeleton className={b('summary-skeleton-title')} delay={0} />
                        <Skeleton className={b('summary-skeleton-description')} delay={0} />
                        <Flex direction="column" gap={3} className={b('summary-skeleton-rows')}>
                            <Flex direction="column" gap={3} className={b('summary-skeleton-row')}>
                                <Flex
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    gap={4}
                                    className={b('summary-skeleton-header')}
                                >
                                    <div />
                                    <Flex
                                        wrap
                                        justifyContent="flex-end"
                                        gap={3}
                                        className={b('summary-skeleton-metrics')}
                                    >
                                        {[0, 1, 2].map((metricIndex) => (
                                            <Skeleton
                                                key={metricIndex}
                                                className={b('summary-skeleton-metric')}
                                                delay={0}
                                            />
                                        ))}
                                    </Flex>
                                </Flex>
                                <Skeleton className={b('summary-skeleton-progress')} delay={0} />
                                <Flex
                                    justifyContent="flex-end"
                                    className={b('summary-skeleton-footer')}
                                >
                                    <Skeleton className={b('summary-skeleton-percent')} delay={0} />
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}

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
    const grouped = mediaSections.length > 1;

    if (loading) {
        return (
            <Flex direction="column" gap={4} className={b()}>
                <TenantStorageSummarySkeleton />
                <TenantStorageTopUsageTable loading error={undefined} rows={[]} withData={false} />
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap={4} className={b()}>
            <div className={b('sections-group')}>
                <div className={b('sections-inner')}>
                    {grouped ? (
                        <TenantStorageGroupedMediaSectionsView
                            sections={mediaSections}
                            data={data}
                        />
                    ) : (
                        mediaSections.map((section, index) => (
                            <TenantStorageMediaSectionView
                                key={`${section.mediaType}-${index}`}
                                section={section}
                                showMediaTypeLabel={false}
                                data={data}
                            />
                        ))
                    )}
                </div>
            </div>
            <TenantStorageTopUsageTable
                loading={false}
                error={topRowsError}
                rows={data.topRows}
                withData={Boolean(currentData)}
            />
        </Flex>
    );
}
