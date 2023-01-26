import {Fragment} from 'react';
import cn from 'bem-cn-lite';

import type {TEvDescribeSchemeResult, TIndexDescription} from '../../../../../types/api/schema';
import {getEntityName} from '../../../utils';

import {selectSchemaData} from '../../../../../store/reducers/schema';
import {useTypedSelector} from '../../../../../utils/hooks';

import {formatTableIndexItem} from '../../../../../components/InfoViewer/formatters';
import {InfoViewer, InfoViewerItem} from '../../../../../components/InfoViewer';

import {prepareTableInfo} from '../utils';

import "../Overview.scss"

const b = cn('ydb-diagnostics-overview');

const DISPLAYED_FIELDS: Set<keyof TIndexDescription> = new Set([
    'Type',
    'State',
    'DataSize',
    'KeyColumnNames',
    'DataColumnNames',
]);

const prepareTableIndexGeneralInfo = (data: TEvDescribeSchemeResult) => {
    const TableIndex = data.PathDescription?.TableIndex;
    const info: Array<InfoViewerItem> = [];

    let key: keyof TIndexDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatTableIndexItem(key, TableIndex?.[key]));
        }
    }

    return info;
};

interface TableIndexInfoProps {
    data?: TEvDescribeSchemeResult;
    childrenPaths?: string[];
}

export const TableIndexInfo = ({data, childrenPaths}: TableIndexInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    const indexImpTableData = useTypedSelector((state) =>
        selectSchemaData(state, childrenPaths?.[0]),
    );

    if (!data || !indexImpTableData) {
        return <div className="error">No {entityName} data</div>;
    }

    const {
        generalTableInfo = [],
        tableStatsInfo = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
    } = prepareTableInfo(indexImpTableData);

    const generalIndexInfo = prepareTableIndexGeneralInfo(data);

    return (
        <div className={b()}>
            <div className={b('row')}>
                <div className={b('col')}>
                    <InfoViewer
                        info={generalIndexInfo}
                        title={entityName}
                        className={b('info-block')}
                    />
                </div>
                <div className={b('col')}>
                    <InfoViewer
                        info={generalTableInfo}
                        title={'Index Table'}
                        className={b('info-block')}
                    />
                </div>
            </div>
            <div className={b('row')}>
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
                        {tableStatsInfo.map((infoItem, index) => (
                            <Fragment key={index}>
                                <InfoViewer
                                    info={infoItem}
                                    title={index === 0 ? 'Table Stats' : undefined}
                                    className={b('info-block')}
                                    nullOnEmptyInfo
                                />
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
