import React from 'react';

import {Alert, Button, Flex, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {YDBDefinitionList} from '../../../components/YDBDefinitionList/YDBDefinitionList';
import {parseQuery} from '../../../routes';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {setHeaderBreadcrumbs} from '../../../store/reducers/header/header';
import type {TTenant} from '../../../types/api/tenant';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {useTypedDispatch} from '../../../utils/hooks';
import {
    canShowTenantBackupsTab,
    canShowTenantMonitoringTab,
} from '../../../utils/monitoringVisibility';

import i18n from './i18n';
import {getControlPlaneTab, prepareControlPlaneInfo} from './utils';
import type {ControlPlaneTab} from './utils';

import './DatabaseAvailability.scss';

const b = cn('ydb-control-plane-unavailable');

interface ControlPlaneUnavailableProps {
    database: string;
    tenant: TTenant;
    onRetry: () => void;
}

export function ControlPlaneUnavailable({database, tenant, onRetry}: ControlPlaneUnavailableProps) {
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const location = useLocation();
    const dispatch = useTypedDispatch();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const controlPlane = tenant.ControlPlane;
    const databaseFullPath = tenant.Name || database;
    const hasBackups = canShowTenantBackupsTab(controlPlane);
    const hasMonitoring = canShowTenantMonitoringTab(controlPlane, clusterMonitoring);

    // The tab is local state: the runtime route and the saved default tab are restored on recovery.
    const [activeTab, setActiveTab] = React.useState<unknown>(
        () => parseQuery(location).diagnosticsTab,
    );
    const selectedTab = getControlPlaneTab(activeTab, hasBackups, hasMonitoring);

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('tenant', {databaseName: tenant.Name || '', database}));
    }, [database, dispatch, tenant.Name]);

    const renderContent = (tab: ControlPlaneTab) => {
        switch (tab) {
            case 'backups':
                return uiFactory.renderBackups?.({database, scrollContainerRef});
            case 'monitoring':
                return uiFactory.renderMonitoring?.({database, databaseFullPath});
            default:
                return <ControlPlaneOverview database={database} tenant={tenant} />;
        }
    };

    return (
        <Flex direction="column" gap={4} className={b()} qa="control-plane-unavailable">
            <Alert
                theme="warning"
                layout="horizontal"
                title={i18n('title_runtime-unavailable')}
                message={i18n('description_runtime-unavailable')}
                actions={<Button onClick={onRetry}>{i18n('action_retry')}</Button>}
            />
            <TabProvider value={selectedTab} onUpdate={setActiveTab}>
                <TabList>
                    <Tab value="overview">{i18n('title_overview')}</Tab>
                    {hasBackups && <Tab value="backups">{i18n('title_backups')}</Tab>}
                    {hasMonitoring && <Tab value="monitoring">{i18n('title_monitoring')}</Tab>}
                </TabList>
            </TabProvider>
            <div ref={scrollContainerRef} className={b('content')}>
                {renderContent(selectedTab)}
            </div>
        </Flex>
    );
}

function ControlPlaneOverview({database, tenant}: {database: string; tenant: TTenant}) {
    const values = prepareControlPlaneInfo(tenant);
    const items = [
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
        <React.Fragment>
            <Text as="h1" variant="header-1">
                {tenant.ControlPlane?.name || tenant.Name || database}
            </Text>
            <YDBDefinitionList items={items} />
        </React.Fragment>
    );
}
