import React from 'react';

import {InfoViewer} from '../../../../../components/InfoViewer';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';

import {PartitionsProgress} from './PartitionsProgress/PartitionsProgress';
import i18n from './i18n';
import {prepareTableInfo} from './prepareTableInfo';

import './TableInfo.scss';

const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
}

export const TableInfo = ({data, type}: TableInfoProps) => {
    const {
        generalInfo,
        tableStatsInfo,
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
        partitionProgressConfig,
    } = React.useMemo(() => prepareTableInfo(data, type), [data, type]);

    // Feature flag: show partitions progress only if WINDOW_SHOW_TABLE_SETTINGS is truthy
    const isPartitionsProgressEnabled = Boolean(
        (window as unknown as {WINDOW_SHOW_TABLE_SETTINGS?: unknown}).WINDOW_SHOW_TABLE_SETTINGS,
    );

    return (
        <div className={b()}>
            <div className={b('title')}>{i18n('title')}</div>
            {isPartitionsProgressEnabled && partitionProgressConfig && (
                <div className={b('progress-bar')}>
                    <PartitionsProgress
                        minPartitions={partitionProgressConfig.minPartitions}
                        partitionsCount={partitionProgressConfig.partitionsCount}
                        maxPartitions={partitionProgressConfig.maxPartitions}
                    />
                </div>
            )}
            <InfoViewer
                info={generalInfo}
                className={b('info-block')}
                renderEmptyState={() => <div className={b('title')}>{i18n('title')}</div>}
            />
            <div className={b('row')}>
                {tableStatsInfo ? (
                    <div className={b('col')}>
                        {tableStatsInfo.map((info, index) => (
                            <InfoViewer
                                key={index}
                                info={info}
                                title={index === 0 ? i18n('tableStats') : undefined}
                                className={b('info-block')}
                                renderEmptyState={() => null}
                            />
                        ))}
                    </div>
                ) : null}
                {tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0 ? (
                    <div className={b('col')}>
                        <InfoViewer
                            info={tabletMetricsInfo}
                            title={i18n('tabletMetrics')}
                            className={b('info-block')}
                            renderEmptyState={() => null}
                        />
                        <InfoViewer
                            info={partitionConfigInfo}
                            title={i18n('partitionConfig')}
                            className={b('info-block')}
                            renderEmptyState={() => null}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};
