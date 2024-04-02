import React from 'react';

import {InfoViewer} from '../../../../../components/InfoViewer';
import type {KeyValueRow} from '../../../../../types/api/query';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {getEntityName} from '../../../utils';

import i18n from './i18n';
import {prepareTableInfo} from './prepareTableInfo';

import './TableInfo.scss';

const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
    olapStats?: KeyValueRow[];
}

export const TableInfo = ({data, type, olapStats}: TableInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const {
        generalInfo = [],
        tableStatsInfo = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
    } = React.useMemo(() => prepareTableInfo(data, type, olapStats), [data, type, olapStats]);

    return (
        <div className={b()}>
            <InfoViewer
                info={generalInfo}
                title={entityName}
                className={b('info-block')}
                renderEmptyState={() => <div className={b('title')}>{entityName}</div>}
            />
            <div className={b('row')}>
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
