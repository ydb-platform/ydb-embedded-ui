import React from 'react';

import {Helmet} from 'react-helmet-async';

import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {
    useConfigAvailable,
    useTopicDataAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {useScrollPosition, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoringTab} from '../../../utils/monitoringVisibility';
import {useCurrentSchema} from '../TenantContext';
import {isDatabaseEntityType} from '../utils/schema';

import {getPagesByType} from './DiagnosticsPages';
import {DiagnosticsTabs} from './DiagnosticsTabs/DiagnosticsTabs';
import {renderDiagnosticsTabContent} from './tabsContent';

import './Diagnostics.scss';

interface DiagnosticsProps {
    additionalTenantProps?: AdditionalTenantsProps;
}

const b = cn('kv-tenant-diagnostics');

function Diagnostics({additionalTenantProps}: DiagnosticsProps) {
    const {path, database, type, subType, databaseFullPath} = useCurrentSchema();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dispatch = useTypedDispatch();
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const {controlPlane, databaseType} = useTenantBaseInfo(
        isDatabaseEntityType(type) ? database : '',
    );
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();

    const hasConfigs = useConfigAvailable();
    const hasTopicData = useTopicDataAvailable();
    const isViewerUser = useIsViewerUser();
    const pages = getPagesByType(type, subType, {
        hasTopicData,
        isTopLevel: path === database,
        hasBackups: typeof uiFactory.renderBackups === 'function' && Boolean(controlPlane),
        hasConfigs: isViewerUser && hasConfigs,
        hasAccess: uiFactory.hasAccess,
        hasMonitoring: canShowTenantMonitoringTab(controlPlane, clusterMonitoring),
        databaseType,
    });
    let activeTab = pages.find((el) => el.id === diagnosticsTab);
    if (!activeTab) {
        activeTab = pages[0];
    }

    React.useEffect(() => {
        if (activeTab && activeTab.id !== diagnosticsTab) {
            dispatch(setDiagnosticsTab(activeTab.id));
        }
    }, [activeTab, diagnosticsTab, dispatch]);

    const renderTabContent = () => {
        return renderDiagnosticsTabContent({
            activeTabId: activeTab.id,
            type,
            subType,
            database,
            path,
            databaseFullPath,
            additionalTenantProps,
            scrollContainerRef: containerRef,
        });
    };

    useScrollPosition(
        containerRef,
        `tenant-diagnostics-${database}-${activeTab?.id}`,
        activeTab?.id === TENANT_DIAGNOSTICS_TABS_IDS.overview,
    );

    return (
        <div className={b()}>
            {activeTab ? (
                <Helmet>
                    <title>{activeTab.title}</title>
                </Helmet>
            ) : null}
            <DiagnosticsTabs activeTab={activeTab} tabs={pages} />
            <DrawerContextProvider>
                <div className={b('page-wrapper')} ref={containerRef}>
                    {renderTabContent()}
                </div>
            </DrawerContextProvider>
        </div>
    );
}

export default Diagnostics;
