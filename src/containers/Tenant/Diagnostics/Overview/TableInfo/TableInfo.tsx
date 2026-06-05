import React from 'react';

import {ChevronDown, ChevronUp, Gear} from '@gravity-ui/icons';
import {ActionTooltip, Button, Disclosure, Flex, Icon} from '@gravity-ui/uikit';

import {operationsApi} from '../../../../../store/reducers/operations';
import {EPathType} from '../../../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {useCompactionFeature} from '../../../../../utils/hooks/useCompactionFeature';
import {useStartCompaction} from '../../../../../utils/hooks/useStartCompaction';
import {EntityTitle} from '../../../EntityTitle/EntityTitle';
import {isRowTableType} from '../../../utils/schema';

import {
    CompactTableAction,
    CompactTableStatusBanner,
} from './CompactTableAction/CompactTableAction';
import {PartitionsProgress} from './PartitionsProgress/PartitionsProgress';
import {TableInfoSection} from './components/TableInfoSection';
import {useTableCompaction} from './hooks/useTableCompaction';
import {useTablePartitioning} from './hooks/useTablePartitioning';
import i18n from './i18n';
import {prepareTableInfo} from './prepareTableInfo';

import './TableInfo.scss';

export const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
    database: string;
    path: string;
}

const TableInfoHeader = ({data}: {data?: TEvDescribeSchemeResult}) => {
    const actualType = data?.PathDescription?.Self?.PathType;
    const isRowTable = isRowTableType(actualType);
    const title: React.ReactNode = isRowTable ? (
        i18n('title_partitioning')
    ) : (
        <EntityTitle data={data?.PathDescription} />
    );

    return <div className={b('title')}>{title}</div>;
};

export const TableInfo = ({data, type, database, path}: TableInfoProps) => {
    const isRowTable = type === EPathType.EPathTypeTable;

    // Prepare all table information
    const tableInfo = React.useMemo(() => prepareTableInfo(data, type), [data, type]);

    const {
        generalInfoLeft = [],
        generalInfoRight = [],
        generalStats = [],
        tableStatsInfo = [],
        generalMetrics = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
        partitionProgressConfig,
        managePartitioningDialogConfig,
    } = tableInfo;

    // Calculate if there's expandable content
    const hasMoreLeft = tableStatsInfo.some((items) => items.length > 0);
    const hasMoreRight = tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0;

    // Compaction logic (only for row tables)
    const {compactionEnabled} = useCompactionFeature(database, isRowTable);
    const compactionEnabledForTable = isRowTable && compactionEnabled;
    const {runningCompaction, isFetching: isCompactionFetching} = useTableCompaction(
        database,
        path,
        compactionEnabledForTable,
    );

    const startCompaction = useStartCompaction();

    const [cancelOperation, {isLoading: isCancellingOperation}] =
        operationsApi.useCancelOperationMutation();

    const handleStartCompaction = React.useCallback(
        async ({cascade, parallel}: {cascade: boolean; parallel?: number}) => {
            await startCompaction({
                database,
                path,
                cascade,
                parallel,
            });
        },
        [database, path, startCompaction],
    );

    const handleCancelCompaction = React.useCallback(async () => {
        if (!runningCompaction?.id) {
            return;
        }
        await cancelOperation({database, id: runningCompaction.id}).unwrap();
    }, [database, cancelOperation, runningCompaction?.id]);

    // Partitioning logic
    const {handleOpenManagePartitioning} = useTablePartitioning(
        database,
        path,
        managePartitioningDialogConfig,
    );

    // UI state
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandedChange = React.useCallback((value: boolean) => setExpanded(value), []);
    const hasMore = React.useMemo(() => hasMoreLeft || hasMoreRight, [hasMoreLeft, hasMoreRight]);

    return (
        <div className={b()}>
            {compactionEnabledForTable && runningCompaction && (
                <CompactTableStatusBanner
                    operation={runningCompaction}
                    onCancel={handleCancelCompaction}
                    isCancelling={isCancellingOperation}
                />
            )}
            <Flex
                className={b('header')}
                justifyContent="space-between"
                alignItems="center"
                gap="2"
            >
                <TableInfoHeader data={data} />
                <Flex gap="2" alignItems="center">
                    {managePartitioningDialogConfig && (
                        <ActionTooltip title={i18n('action_manage-partition-config')}>
                            <Button
                                view="normal"
                                size="s"
                                onClick={handleOpenManagePartitioning}
                                aria-label={i18n('action_manage-partition-config')}
                            >
                                <Icon data={Gear} size={16} />
                                {i18n('action_manage-partitioning')}
                            </Button>
                        </ActionTooltip>
                    )}
                    {compactionEnabledForTable && (
                        <CompactTableAction
                            key={`${database}/${path}`}
                            runningCompaction={runningCompaction}
                            isFetching={isCompactionFetching}
                            onApply={handleStartCompaction}
                        />
                    )}
                </Flex>
            </Flex>
            {partitionProgressConfig && (
                <div className={b('progress-bar')}>
                    <PartitionsProgress
                        minPartitions={partitionProgressConfig.minPartitions}
                        partitionsCount={partitionProgressConfig.partitionsCount}
                        maxPartitions={partitionProgressConfig.maxPartitions}
                    />
                </div>
            )}
            <div className={b('row', {'general-info': true})}>
                <div className={b('col')}>
                    <TableInfoSection items={generalInfoLeft} className={b('info-block')} />
                </div>
                <div className={b('col')}>
                    <TableInfoSection items={generalInfoRight} className={b('info-block')} />
                </div>
            </div>

            <div className={b('row')}>
                <div className={b('col')}>
                    <TableInfoSection
                        items={generalStats}
                        title={i18n('title_table-stats')}
                        className={b('info-block')}
                    />
                </div>

                <div className={b('col')}>
                    <TableInfoSection
                        items={generalMetrics}
                        title={i18n('title_tablet-metrics')}
                        className={b('info-block')}
                    />
                </div>
            </div>

            {hasMore ? (
                <Disclosure
                    className={b('show-more-disclosure')}
                    expanded={expanded}
                    onUpdate={handleExpandedChange}
                >
                    <Disclosure.Summary>
                        {(props) => (
                            <Button onClick={props.onClick} view="normal" size="s">
                                {expanded ? i18n('button_show-less') : i18n('button_show-more')}
                                <Icon data={expanded ? ChevronUp : ChevronDown} size={16} />
                            </Button>
                        )}
                    </Disclosure.Summary>

                    <Disclosure.Details>
                        <div className={b('row')}>
                            <div className={b('col')}>
                                {tableStatsInfo
                                    .filter((items) => items.length > 0)
                                    .map((items, index) => (
                                        <TableInfoSection
                                            key={index}
                                            items={items}
                                            className={b('info-block')}
                                        />
                                    ))}
                            </div>

                            <div className={b('col')}>
                                <TableInfoSection
                                    items={tabletMetricsInfo}
                                    className={b('info-block')}
                                />
                                <TableInfoSection
                                    items={partitionConfigInfo}
                                    title={i18n('title_partition-config')}
                                    className={b('info-block')}
                                />
                            </div>
                        </div>
                    </Disclosure.Details>
                </Disclosure>
            ) : null}
        </div>
    );
};
