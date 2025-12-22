import {CirclePlay, Display, Person} from '@gravity-ui/icons';
import {Button, Card, Flex, Icon, Label, Text} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router-dom';

import {TenantTabsGroups} from '../../containers/Tenant/TenantPages';
import {getTenantPath, parseQuery} from '../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../store/reducers/tenant/constants';
import {cn} from '../../utils/cn';

import i18n from './i18n';

import './QueriesActivityAlert.scss';

const b = cn('queries-activity-alert');

interface QueriesActivityAlertProps {
    runningQueriesCount: number;
    uniqueApplications: number;
    uniqueUsers: number;
}

export function QueriesActivityAlert({
    runningQueriesCount,
    uniqueApplications,
    uniqueUsers,
}: QueriesActivityAlertProps) {
    const history = useHistory();
    const location = useLocation();

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
        <div className={b()}>
            <Card className={b('card')} type="container" view="outlined">
                <Flex
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={4}
                    className={b('content')}
                >
                    <Flex>
                        <Text variant="subheader-2" className={b('title')}>
                            {i18n('title_queries-activity')}
                        </Text>
                    </Flex>
                    <Flex wrap alignItems="center" gap={1} className={b('stats')}>
                        <Label
                            theme={runningQueriesCount > 0 ? 'success' : 'unknown'}
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
            </Card>
        </div>
    );
}
