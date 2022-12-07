import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import {formatCPU, formatBytes, formatNumber, formatBps, formatDateTime} from '../../../../utils';

import {InfoViewer, createInfoFormatter} from '../../../../components/InfoViewer';

import {getEntityName} from '../../utils';

import './SchemaInfoViewer.scss';

const b = cn('schema-info-viewer');

const formatTabletMetricsItem = createInfoFormatter({
    values: {
        CPU: formatCPU,
        Memory: formatBytes,
        Storage: formatBytes,
        Network: formatBps,
        ReadThroughput: formatBps,
        WriteThroughput: formatBps,
    },
    defaultValueFormatter: formatNumber,
});

const formatFollowerGroupItem = createInfoFormatter({
    values: {
        FollowerCount: formatNumber,
    },
});

const formatPartitionConfigItem = createInfoFormatter({
    values: {
        FollowerCount: formatNumber,
        CrossDataCenterFollowerCount: formatNumber,
    },
});

const formatTableStatsItem = createInfoFormatter({
    values: {
        DataSize: formatBytes,
        IndexSize: formatBytes,
        LastAccessTime: formatDateTime,
        LastUpdateTime: formatDateTime,
    },
    defaultValueFormatter: formatNumber,
});

const formatTableStats = (fields) =>
    Object.entries(fields)
        .map(([label, value]) => formatTableStatsItem(label, value))
        .filter(({value}) => Boolean(value));

class SchemaInfoViewer extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    renderItem(itemData, title) {
        if (!Array.isArray(itemData) || !itemData.length) {
            return null;
        }

        return (
            <div className={b('item')}>
                <InfoViewer title={title} info={itemData} />
            </div>
        );
    }

    renderContent(data) {
        const {PathDescription = {}} = data;
        const entityName = getEntityName(PathDescription);

        const {
            TableStats = {},
            TabletMetrics = {},
            Table: {PartitionConfig = {}} = {},
        } = PathDescription;
        const {
            PartCount,
            RowCount,
            DataSize,
            IndexSize,

            LastAccessTime,
            LastUpdateTime,

            ImmediateTxCompleted,
            PlannedTxCompleted,
            TxRejectedByOverload,
            TxRejectedBySpace,
            TxCompleteLagMsec,
            InFlightTxCount,

            RowUpdates,
            RowDeletes,
            RowReads,
            RangeReads,
            RangeReadRows,

            ...restTableStats
        } = TableStats;
        const {FollowerGroups, FollowerCount, CrossDataCenterFollowerCount} = PartitionConfig;

        const generalTableInfo = formatTableStats({
            PartCount,
            RowCount,
            DataSize,
            IndexSize,
            ...restTableStats,
        });

        const tableStatsInfo = [
            formatTableStats({
                LastAccessTime,
                LastUpdateTime,
            }),
            formatTableStats({
                ImmediateTxCompleted,
                PlannedTxCompleted,
                TxRejectedByOverload,
                TxRejectedBySpace,
                TxCompleteLagMsec,
                InFlightTxCount,
            }),
            formatTableStats({
                RowUpdates,
                RowDeletes,
                RowReads,
                RangeReads,
                RangeReadRows,
            }),
        ];

        const tabletMetricsInfo = Object.keys(TabletMetrics).map((key) =>
            formatTabletMetricsItem(key, TabletMetrics[key]),
        );

        const partitionConfigInfo = [];

        if (Array.isArray(FollowerGroups) && FollowerGroups.length > 0) {
            partitionConfigInfo.push(
                ...Object.keys(FollowerGroups[0]).map((key) =>
                    formatFollowerGroupItem(key, FollowerGroups[0][key]),
                ),
            );
        } else if (FollowerCount !== undefined) {
            partitionConfigInfo.push(formatPartitionConfigItem('FollowerCount', FollowerCount));
        } else if (CrossDataCenterFollowerCount !== undefined) {
            partitionConfigInfo.push(
                formatPartitionConfigItem(
                    'CrossDataCenterFollowerCount',
                    CrossDataCenterFollowerCount,
                ),
            );
        }

        if (
            [generalTableInfo, tabletMetricsInfo, partitionConfigInfo, tableStatsInfo.flat()].flat()
                .length === 0
        ) {
            return <div className={b('title')}>{entityName}</div>;
        }

        return (
            <div>
                <div>{this.renderItem(generalTableInfo, entityName)}</div>
                <div className={b('row')}>
                    {tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0 ? (
                        <div className={b('col')}>
                            {this.renderItem(tabletMetricsInfo, 'Tablet Metrics')}
                            {this.renderItem(partitionConfigInfo, 'Partition Config')}
                        </div>
                    ) : null}
                    <div className={b('col')}>
                        {tableStatsInfo.map((info, index) => (
                            <React.Fragment key={index}>
                                {this.renderItem(info, index === 0 ? 'Table Stats' : undefined)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const {data} = this.props;
        const entityName = getEntityName(data?.PathDescription);

        if (data) {
            return <div className={b()}>{this.renderContent(data)}</div>;
        } else {
            return <div className="error">No {entityName} data</div>;
        }
    }
}

export default SchemaInfoViewer;
