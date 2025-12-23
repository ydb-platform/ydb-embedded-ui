import React from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, Disclosure, Icon} from '@gravity-ui/uikit';

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
        generalStats = [],
        tableStatsInfo = [],
        generalMetrics = [],
        tabletMetricsInfo = [],
        partitionConfigInfo = [],
        partitionProgressConfig,
    } = React.useMemo(() => prepareTableInfo(data, type), [data, type]);

    const [expanded, setExpanded] = React.useState(false);

    const handleExpandedChange = React.useCallback((value: boolean) => setExpanded(value), []);

    const hasMoreLeft = tableStatsInfo.length > 0;
    const hasMoreRight = tabletMetricsInfo.length > 0 || partitionConfigInfo.length > 0;
    const hasMore = hasMoreLeft || hasMoreRight;

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
                            <Button {...props} view="normal" size="s">
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
                                            key={`table-stats-more-${index}`}
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
