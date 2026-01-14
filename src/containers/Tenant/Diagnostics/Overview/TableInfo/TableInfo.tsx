import React from 'react';

import {ChevronDown, ChevronUp, Gear} from '@gravity-ui/icons';
import {Button, Disclosure, Flex, Icon} from '@gravity-ui/uikit';

import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {tablePartitioningApi} from '../../../../../store/reducers/tablePartitioning/tablePartitioning';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import createToast from '../../../../../utils/createToast';
import {reachMetricaGoal} from '../../../../../utils/yaMetrica';

import {openManagePartitioningDialog} from './ManagePartitioningDialog/ManagePartitioningDialog';
import {PartitionsProgress} from './PartitionsProgress/PartitionsProgress';
import i18n from './i18n';
import {prepareTableInfo} from './prepareTableInfo';
import {prepareUpdatePartitioningRequest} from './utils';

import './TableInfo.scss';

export const b = cn('ydb-diagnostics-table-info');

interface TableInfoProps {
    data?: TEvDescribeSchemeResult;
    type?: EPathType;
    database: string;
    path: string;
}

export const TableInfo = ({data, type, database, path}: TableInfoProps) => {
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
    } = React.useMemo(() => prepareTableInfo(data, type), [data, type]);

    const [expanded, setExpanded] = React.useState(false);

    const handleExpandedChange = React.useCallback((value: boolean) => setExpanded(value), []);

    const hasMoreLeft = tableStatsInfo.some((items) => items.length > 0);
    const hasMoreRight = tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0;
    const hasMore = hasMoreLeft || hasMoreRight;

    const [updatePartitioning] = tablePartitioningApi.useUpdateTablePartitioningMutation();

    const handleOpenManagePartitioning = React.useCallback(() => {
        reachMetricaGoal('openManagePartitioning');
        openManagePartitioningDialog({
            initialValue: managePartitioningDialogConfig,
            onApply: async (value) => {
                reachMetricaGoal('applyManagePartitioning');
                await updatePartitioning(
                    prepareUpdatePartitioningRequest(value, database, path),
                ).unwrap();

                createToast({
                    name: 'updateTablePartitioning',
                    content: i18n('toast_partitioning-updated'),
                    autoHiding: 3000,
                    isClosable: true,
                });
            },
        });
    }, [managePartitioningDialogConfig, database, path, updatePartitioning]);

    return (
        <div className={b()}>
            <Flex
                className={b('header')}
                justifyContent="space-between"
                alignItems="center"
                gap="2"
            >
                <div className={b('title')}>{i18n('title_partitioning')}</div>
                {managePartitioningDialogConfig && (
                    <Button view="normal" size="s" onClick={handleOpenManagePartitioning}>
                        <Icon data={Gear} size={16} />
                    </Button>
                )}
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
                <div className={b('col')}>
                    {generalStats.length > 0 ? (
                        <YDBDefinitionList
                            items={generalStats}
                            title={i18n('title_table-stats')}
                            className={b('info-block')}
                            nameMaxWidth="auto"
                            responsive
                            titleClassname={b('info-title')}
                        />
                    ) : null}
                </div>

                <div className={b('col')}>
                    {generalMetrics.length > 0 ? (
                        <YDBDefinitionList
                            items={generalMetrics}
                            title={i18n('title_tablet-metrics')}
                            className={b('info-block')}
                            nameMaxWidth="auto"
                            responsive
                            titleClassname={b('info-title')}
                        />
                    ) : null}
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
                                        <YDBDefinitionList
                                            key={index}
                                            items={items}
                                            className={b('info-block')}
                                            nameMaxWidth="auto"
                                            responsive
                                        />
                                    ))}
                            </div>

                            <div className={b('col')}>
                                {tabletMetricsInfo.length > 0 ? (
                                    <YDBDefinitionList
                                        items={tabletMetricsInfo}
                                        className={b('info-block')}
                                        nameMaxWidth="auto"
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
                    </Disclosure.Details>
                </Disclosure>
            ) : null}
        </div>
    );
};
