import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';

import {InfoViewer} from '../../../../../components/InfoViewer';

import {getEntityName} from '../../../utils';

import {prepareTableInfo} from './prepareTableInfo';

import i18n from './i18n';

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

    return (
        <div className={b()}>
            <InfoViewer
                info={generalTableInfo}
                title={entityName}
                className={b('info-block')}
                renderEmptyState={() => <div className={b('title')}>{entityName}</div>}
            />
            <div className={b('row')}>
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
            </div>
        </div>
    );
};
