import React from 'react';

import {CirclePlay, Clock, Display, Person, Rocket} from '@gravity-ui/icons';
import {ArrowToggle, Button, Card, Flex, Icon, Label, Text} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';

import {TenantTabsGroups, getTenantPath} from '../../containers/Tenant/TenantPages';
import {parseQuery} from '../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../store/reducers/tenant/constants';
import {cn} from '../../utils/cn';

import {QueriesActivityAlert} from './QueriesActivityAlert';
import {QueriesActivityCharts} from './QueriesActivityCharts';
import {QueriesActivitySkeleton} from './QueriesActivitySkeleton';
import i18n from './i18n';
import {useChartAvailability} from './useChartAvailability';
import {useQueriesActivityData} from './useQueriesActivityData';
import {formatTrendValue} from './utils';

import './QueriesActivityBar.scss';

const b = cn('queries-activity-bar');

interface QueriesActivityBarProps {
    tenantName: string;
}

export function QueriesActivityBar({tenantName}: QueriesActivityBarProps) {
    const history = useHistory();
    const location = useLocation();
    const [expanded, setExpanded] = React.useState(false);

    // Check chart availability without rendering hidden components
    const areChartsAvailable = useChartAvailability(tenantName);

    const {runningQueriesCount, uniqueApplications, uniqueUsers, qps, latency} =
        useQueriesActivityData(tenantName);

    const handleOpenRunningQueries = () => {
        const queryParams = parseQuery(location);
        const path = getTenantPath({
            ...queryParams,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
            queryMode: 'running',
        });
        history.push(path);
    };

    const handleToggleExpanded = () => {
        setExpanded(!expanded);
    };

    // Show skeleton while determining chart availability
    if (areChartsAvailable === null) {
        return <QueriesActivitySkeleton />;
    }

    // Render compact alert-style mode when charts are not available
    if (areChartsAvailable === false) {
        return (
            <QueriesActivityAlert
                runningQueriesCount={runningQueriesCount}
                uniqueApplications={uniqueApplications}
                uniqueUsers={uniqueUsers}
            />
        );
    }

    // Render expandable mode when charts are available
    return (
        <div className={b({expanded})}>
            <Card className={b('card')} type="container" view={expanded ? 'outlined' : 'raised'}>
                <Flex
                    className={b('header')}
                    onClick={handleToggleExpanded}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                >
                    <Flex direction="column">
                        <Text variant="subheader-2" className={b('title')}>
                            {i18n('title_queries-activity')}
                        </Text>
                        <Text color="secondary" variant="caption-2" className={b('subtitle')}>
                            {i18n('context_monitor-changes-realtime')}
                        </Text>
                    </Flex>

                    <Flex alignItems="center" gap={4}>
                        <Flex alignItems="center" gap={1}>
                            <Label
                                theme={runningQueriesCount > 0 ? 'success' : 'unknown'}
                                size="s"
                                icon={<Icon data={CirclePlay} size={14} />}
                            >
                                {runningQueriesCount}
                            </Label>
                            <Label
                                theme="unknown"
                                icon={<Icon data={Rocket} />}
                                size="s"
                                value={formatTrendValue(qps?.trend?.value ?? 0)}
                            >
                                {i18n('value_per-sec', {count: qps?.value ?? '0'})}
                            </Label>
                            <Label
                                theme="unknown"
                                icon={<Icon data={Clock} />}
                                size="s"
                                value={formatTrendValue(latency?.trend?.value ?? 0)}
                            >
                                {i18n('value_ms', {time: latency?.value ?? '0'})}
                            </Label>
                        </Flex>

                        <ArrowToggle direction={expanded ? 'top' : 'bottom'} size={16} />
                    </Flex>
                </Flex>

                {expanded && (
                    <Flex direction="column" gap={4} className={b('content')}>
                        <Flex wrap alignItems="center" gap={1} className={b('stats')}>
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

                            {runningQueriesCount > 0 && (
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={handleOpenRunningQueries}
                                    className={b('open-queries-button')}
                                >
                                    {i18n('action_open-running-queries')}
                                </Button>
                            )}
                        </Flex>
                    </Flex>
                )}
                <QueriesActivityCharts tenantName={tenantName} expanded={expanded} />
            </Card>
        </div>
    );
}
