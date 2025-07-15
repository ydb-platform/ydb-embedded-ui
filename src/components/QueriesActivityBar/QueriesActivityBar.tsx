import React from 'react';

import {CirclePlay, Clock, Display, Person, Rocket} from '@gravity-ui/icons';
import {ArrowToggle, Button, Disclosure, Flex, Icon, Label, Text} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';

import {TenantTabsGroups, getTenantPath} from '../../containers/Tenant/TenantPages';
import {parseQuery} from '../../routes';
import {topQueriesApi} from '../../store/reducers/executeTopQueries/executeTopQueries';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../store/reducers/tenant/constants';
import type {KeyValueRow} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import type {TimeFrame} from '../../utils/timeframes';
import {chartApi} from '../MetricChart/reducer';
import type {ChartDataStatus} from '../MetricChart/types';

import {QueriesActivityCharts} from './QueriesActivityCharts';
import i18n from './i18n';
import {calculateLatency, calculateQueriesPerSecond, formatTrendValue} from './utils';

import './QueriesActivityBar.scss';

const b = cn('queries-activity-bar');

interface QueriesActivityBarProps {
    tenantName: string;
}

export function QueriesActivityBar({tenantName}: QueriesActivityBarProps) {
    const history = useHistory();
    const location = useLocation();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [expanded, setExpanded] = React.useState(false);
    const [queriesTimeFrame] = React.useState<TimeFrame>('1h');
    const [latenciesTimeFrame] = React.useState<TimeFrame>('1h');
    const [isActivityBarHidden, setIsActivityBarHidden] = React.useState<boolean>(true);

    // Refetch data only if activity bar successfully loaded
    const shouldRefresh = isActivityBarHidden ? 0 : autoRefreshInterval;

    /**
     * Activity bar should be hidden, if charts are not enabled:
     * 1. GraphShard is not enabled
     * 2. ydb version does not have /viewer/json/render endpoint (400, 404, CORS error, etc.)
     *
     * If at least one chart successfully loaded, activity bar should be shown
     * @link https://github.com/ydb-platform/ydb-embedded-ui/issues/659
     * @todo disable only for specific errors ('GraphShard is not enabled') after ydb-stable-24 is generally used
     */
    const handleChartDataStatusChange = React.useCallback((chartStatus: ChartDataStatus) => {
        if (chartStatus === 'success') {
            setIsActivityBarHidden(false);
        }
    }, []);

    // Fetch running queries
    const {data: runningQueriesData} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database: tenantName,
            filters: {},
        },
        {pollingInterval: shouldRefresh},
    );

    // Fetch queries per second data for header metrics
    const {data: queriesPerSecData} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.requests'}],
            timeFrame: queriesTimeFrame,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh},
    );

    // Fetch latency data for header metrics
    const {data: latencyData} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.latencies.p99'}],
            timeFrame: latenciesTimeFrame,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh},
    );

    const runningQueriesCount = runningQueriesData?.resultSets?.[0]?.result?.length || 0;

    const qps = React.useMemo(
        () => calculateQueriesPerSecond(queriesPerSecData?.metrics?.[0]?.data),
        [queriesPerSecData?.metrics?.[0]?.data],
    );

    const latency = React.useMemo(
        () => calculateLatency(latencyData?.metrics?.[0]?.data),
        [latencyData?.metrics?.[0]?.data],
    );

    // Calculate unique applications and users
    const uniqueApplications = React.useMemo(() => {
        const apps = new Set<string>();
        runningQueriesData?.resultSets?.[0]?.result?.forEach((row: KeyValueRow) => {
            if (row.ApplicationName) {
                apps.add(String(row.ApplicationName));
            }
        });
        return apps.size;
    }, [runningQueriesData]);

    const uniqueUsers = React.useMemo(() => {
        const users = new Set<string>();
        runningQueriesData?.resultSets?.[0]?.result?.forEach((row: KeyValueRow) => {
            if (row.UserSID) {
                users.add(String(row.UserSID));
            }
        });
        return users.size;
    }, [runningQueriesData]);

    const handleOpenRunningQueries = () => {
        const queryParams = parseQuery(location);
        const path = getTenantPath({
            ...queryParams,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
            queryMode: 'running',
        });
        history.push(path);
    };

    return (
        <div className={b({expanded})} style={{display: isActivityBarHidden ? 'none' : undefined}}>
            <Disclosure expanded={expanded} onUpdate={setExpanded} className={b('disclosure')}>
                <Disclosure.Summary>
                    {(props) => (
                        <div {...props} className={b('header')}>
                            <Flex justifyContent="space-between" className={b('content-wrapper')}>
                                <Flex direction="column" className={b('title-section')}>
                                    <Text variant="subheader-2" className={b('title')}>
                                        {i18n('title_queries-activity')}
                                    </Text>
                                    <Text
                                        color="secondary"
                                        variant="caption-2"
                                        className={b('subtitle')}
                                    >
                                        {i18n('context_monitor-changes-realtime')}
                                    </Text>
                                </Flex>

                                <div className={b('metrics')}>
                                    <Label
                                        theme={runningQueriesCount > 0 ? 'success' : 'unknown'}
                                        size="s"
                                        icon={<Icon data={CirclePlay} size={14} />}
                                    >
                                        {runningQueriesCount}
                                    </Label>

                                    <Label
                                        theme="clear"
                                        size="s"
                                        icon={<Icon data={Rocket} size={14} />}
                                        value={formatTrendValue(qps.trend.value)}
                                    >
                                        {i18n('value_per-sec', {count: qps.value})}
                                    </Label>

                                    <Label
                                        theme="clear"
                                        size="s"
                                        icon={<Icon data={Clock} size={14} />}
                                        value={formatTrendValue(latency.trend.value)}
                                    >
                                        {i18n('value_ms', {time: latency.value})}
                                    </Label>
                                </div>
                            </Flex>

                            <ArrowToggle direction={props.expanded ? 'top' : 'bottom'} />
                        </div>
                    )}
                </Disclosure.Summary>

                {expanded ? (
                    <div className={b('content')}>
                        <div className={b('stats')}>
                            <Label
                                theme="unknown"
                                icon={<Icon data={CirclePlay} />}
                                size="s"
                                value={String(runningQueriesCount)}
                            >
                                {i18n('field_running-queries')}
                            </Label>

                            <Label
                                theme="unknown"
                                icon={<Icon data={Display} />}
                                size="s"
                                value={String(uniqueApplications)}
                            >
                                {i18n('field_applications')}
                            </Label>

                            <Label
                                theme="unknown"
                                icon={<Icon data={Person} />}
                                size="s"
                                value={String(uniqueUsers)}
                            >
                                {i18n('field_users')}
                            </Label>

                            <Button
                                view="outlined"
                                size="s"
                                onClick={handleOpenRunningQueries}
                                className={b('open-queries-button')}
                            >
                                {i18n('action_open-running-queries')}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Disclosure>
            <QueriesActivityCharts
                tenantName={tenantName}
                expanded={expanded}
                onChartDataStatusChange={handleChartDataStatusChange}
            />
        </div>
    );
}
