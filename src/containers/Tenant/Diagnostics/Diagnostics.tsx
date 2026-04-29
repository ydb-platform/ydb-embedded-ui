import React from 'react';

import {Text} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {useScrollPosition, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useNavigationV2Enabled} from '../utils/useNavigationV2Enabled';

import type {DatabasePagesDisplay} from './DiagnosticsPages';
import {DiagnosticsTabs} from './DiagnosticsTabs/DiagnosticsTabs';
import {b} from './shared';
import {renderDiagnosticsTabContent} from './tabsContent';
import {useDiagnosticsPages} from './useDiagnosticsPages';

import './Diagnostics.scss';

interface DiagnosticsProps {
    path: string;
    database: string;
    databaseFullPath: string;
    type?: EPathType;
    subType?: EPathSubType;

    databasePagesDisplay?: DatabasePagesDisplay;
    additionalTenantProps?: AdditionalTenantsProps;
}

function Diagnostics({
    path,
    database,
    databaseFullPath,
    type,
    subType,
    databasePagesDisplay,
    additionalTenantProps,
}: DiagnosticsProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dispatch = useTypedDispatch();
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const isV2NavigationEnabled = useNavigationV2Enabled();

    const {name} = useTenantBaseInfo(database);

    const pages = useDiagnosticsPages({
        path,
        database,
        databaseFullPath,
        type,
        subType,
        databasePagesDisplay,
    });

    const activeTab = React.useMemo(() => {
        let activeTab = pages.find((el) => el.id === diagnosticsTab);
        if (!activeTab) {
            activeTab = pages[0];
        }

        return activeTab;
    }, [diagnosticsTab, pages]);

    React.useEffect(() => {
        if (activeTab && activeTab.id !== diagnosticsTab) {
            dispatch(setDiagnosticsTab(activeTab.id));
        }
    }, [activeTab, diagnosticsTab, dispatch]);

    const renderTabContent = () => {
        return renderDiagnosticsTabContent({
            activeTabId: activeTab.id,
            type,
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

    const renderDBName = () => {
        if (isV2NavigationEnabled && databasePagesDisplay === 'database') {
            return (
                <Text variant="header-1" className={b('db-name')}>
                    {name}
                </Text>
            );
        }

        return null;
    };

    return (
        <div className={b()}>
            {activeTab ? (
                <Helmet>
                    <title>{activeTab.title}</title>
                </Helmet>
            ) : null}
            {renderDBName()}
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
