import React from 'react';

import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';

import {PartitionsProgress} from './PartitionsProgress/PartitionsProgress';
import i18n from './i18n';
import {prepareTableInfo} from './prepareTableInfo';

import './TableInfo.scss';

export const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
}

export const TableInfo = ({data, type}: TableInfoProps) => {
    const {
        generalInfoLeft = [],
        generalInfoRight = [],
        tableStatsInfo = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
        partitionProgressConfig,
    } = React.useMemo(() => prepareTableInfo(data, type), [data, type]);

    return (
        <div className={b()}>
            <div className={b('title')}>{i18n('title_partitioning')}</div>
            {partitionProgressConfig && (
                <div className={b('progress-bar')}>
                    <PartitionsProgress
                        minPartitions={partitionProgressConfig.minPartitions}
                        partitionsCount={partitionProgressConfig.partitionsCount}
                        maxPartitions={partitionProgressConfig.maxPartitions}
                    />
                </div>
            )}
            <div className={b('row')}>
                <div className={b('col')}>
                    {generalInfoLeft.length > 0 ? (
                        <YDBDefinitionList
                            nameMaxWidth="auto"
                            responsive
                            className={b('info-block')}
                            items={generalInfoLeft}
                            titleClassname={b('info-title')}
                        />
                    ) : null}
                </div>
                <div className={b('col')}>
                    {generalInfoRight.length > 0 ? (
                        <YDBDefinitionList
                            nameMaxWidth="auto"
                            responsive
                            className={b('info-block')}
                            items={generalInfoRight}
                            titleClassname={b('info-title')}
                        />
                    ) : null}
                </div>
            </div>
            <div className={b('row')}>
                {tableStatsInfo?.length ? (
                    <div className={b('col')}>
                        {tableStatsInfo
                            .filter((items) => items.length > 0)
                            .map((items, index) => (
                                <YDBDefinitionList
                                    key={index}
                                    items={items}
                                    title={index === 0 ? i18n('title_table-stats') : undefined}
                                    className={b('info-block')}
                                    nameMaxWidth="auto"
                                    responsive
                                    titleClassname={b('info-title')}
                                />
                            ))}
                    </div>
                ) : null}

                <div className={b('col')}>
                    {tabletMetricsInfo.length > 0 ? (
                        <YDBDefinitionList
                            items={tabletMetricsInfo}
                            title={i18n('title_tablet-metrics')}
                            className={b('info-block')}
                            nameMaxWidth="auto"
                            titleClassname={b('info-title')}
                            responsive
                        />
                    ) : null}
                    {partitionConfigInfo.length > 0 ? (
                        <YDBDefinitionList
                            items={partitionConfigInfo}
                            title={i18n('title_partition-config')}
                            className={b('info-block')}
                            nameMaxWidth="auto"
                            responsive
                            titleClassname={b('info-title')}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};
