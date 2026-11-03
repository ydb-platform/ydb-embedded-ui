import React from 'react';

import {Alert, Button, Flex, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {YDBDefinitionList} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import {parseQuery} from '../../../routes';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {setHeaderBreadcrumbs} from '../../../store/reducers/header/header';
import type {TenantInfo} from '../../../store/reducers/tenant/availability';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {useTypedDispatch} from '../../../utils/hooks';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../../utils/hooks/useDatabaseFromQuery';

import i18n from './i18n';
import {getControlPlaneExtensions, getControlPlaneTab, prepareControlPlaneInfo} from './utils';

import './ControlPlaneUnavailable.scss';

const b = cn('ydb-control-plane-unavailable');

export function ControlPlaneUnavailable({
    tenant,
    onRetry,
}: {
    tenant: TenantInfo;
    onRetry: () => void;
}) {
    const database = useDatabaseFromQuery() ?? '';
    const clusterName = useClusterNameFromQuery();
    const cluster = useClusterBaseInfo();
    const location = useLocation();
    const dispatch = useTypedDispatch();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const cp = tenant.ControlPlane;
    const {hasBackups, hasMonitoring} = getControlPlaneExtensions({
        tenant,
        database,
        clusterName,
        clusterDataLoaded: cluster.isDataLoaded,
        backupsRenderer: Boolean(uiFactory.renderBackups),
        monitoringRenderer: Boolean(uiFactory.renderMonitoring),
    });
    const {diagnosticsTab} = parseQuery(location);
    const initialTab = getControlPlaneTab(diagnosticsTab, hasBackups, hasMonitoring);
    // Keep temporary CP navigation separate from the user's saved runtime route and default tab.
    const [activeTab, setActiveTab] = React.useState(initialTab);
    const selectedTab = getControlPlaneTab(activeTab, hasBackups, hasMonitoring);

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('tenant', {databaseName: tenant.Name || '', database}));
    }, [database, dispatch, tenant.Name]);

    const values = prepareControlPlaneInfo(tenant);
    const fields = [
        {name: i18n('field_name'), content: values.name},
        {name: i18n('field_id'), content: values.id},
        {name: i18n('field_path'), content: values.path},
        {name: i18n('field_endpoint'), content: values.endpoint},
        {name: i18n('field_folder'), content: values.folder},
        {name: i18n('field_location'), content: values.location},
        {name: i18n('field_type'), content: values.type},
        {name: i18n('field_status'), content: values.status},
        {name: i18n('field_preset'), content: values.preset},
        {name: i18n('field_size'), content: values.size},
        {name: i18n('field_storage-limit'), content: values.storageLimit},
        {name: i18n('field_storage-options'), content: values.storageOptions},
    ];

    return (
        <Flex direction="column" gap={4} className={b()} qa="control-plane-unavailable">
            <Alert
                theme="warning"
                title={i18n('title_runtime-unavailable')}
                message={i18n('description_runtime-unavailable')}
            />
            <Flex gap={2}>
                <Button onClick={onRetry}>{i18n('action_retry')}</Button>
                <Button onClick={() => setActiveTab('overview')}>{i18n('action_overview')}</Button>
            </Flex>
            <TabProvider value={selectedTab} onUpdate={setActiveTab}>
                <TabList>
                    <Tab value="overview">{i18n('title_overview')}</Tab>
                    {hasBackups && <Tab value="backups">{i18n('title_backups')}</Tab>}
                    {hasMonitoring && <Tab value="monitoring">{i18n('title_monitoring')}</Tab>}
                </TabList>
            </TabProvider>
            <div ref={scrollContainerRef} className={b('content')}>
                {selectedTab === 'overview' ? (
                    <React.Fragment>
                        <Text as="h1" variant="header-1">
                            {cp?.name || tenant.Name || database}
                        </Text>
                        <YDBDefinitionList items={fields} />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {selectedTab === 'backups' &&
                            uiFactory.renderBackups?.({database, scrollContainerRef})}
                        {selectedTab === 'monitoring' &&
                            tenant.Name &&
                            uiFactory.renderMonitoring?.({database, databaseFullPath: tenant.Name})}
                    </React.Fragment>
                )}
            </div>
        </Flex>
    );
}
