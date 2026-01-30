import React from 'react';

import {Helmet} from 'react-helmet-async';

import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useScrollPosition, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';

import type {DatabasePagesDisplay} from './DiagnosticsPages';
import {DiagnosticsTabs} from './DiagnosticsTabs/DiagnosticsTabs';
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

const b = cn('kv-tenant-diagnostics');

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
