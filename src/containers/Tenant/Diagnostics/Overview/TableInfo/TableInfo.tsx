import React, {useMemo} from 'react';
import cn from 'bem-cn-lite';

import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import {InfoViewer} from '../../../../../components/InfoViewer';

import {getEntityName} from '../../../utils';

import {prepareTableInfo} from './prepareTableInfo';

import './TableInfo.scss';

const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const TableInfo = ({data}: TableInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const {
        generalTableInfo = [],
        tableStatsInfo = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
    } = useMemo(() => prepareTableInfo(data), [data]);

    if (
        [generalTableInfo, tabletMetricsInfo, partitionConfigInfo, tableStatsInfo.flat()].flat()
            .length === 0
    ) {
        return <div className={b('title')}>{entityName}</div>;
    }

    return (
        <div className={b()}>
            <InfoViewer info={generalTableInfo} title={entityName} className={b('info-block')} />
            <div className={b('row')}>
                {tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0 ? (
                    <div className={b('col')}>
                        <InfoViewer
                            info={tabletMetricsInfo}
                            title={'Tablet Metrics'}
                            className={b('info-block')}
                            nullOnEmptyInfo
                        />
                        <InfoViewer
                            info={partitionConfigInfo}
                            title={'Partition Config'}
                            className={b('info-block')}
                            nullOnEmptyInfo
                        />
                    </div>
                ) : null}
                <div className={b('col')}>
                    {tableStatsInfo.map((info, index) => (
                        <React.Fragment key={index}>
                            <InfoViewer
                                info={info}
                                title={index === 0 ? 'Table Stats' : undefined}
                                className={b('info-block')}
                                nullOnEmptyInfo
                            />
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
