import React from 'react';

import {Helmet} from 'react-helmet-async';

import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import SplitPane from '../../components/SplitPane';
import {useClusterWithProxy} from '../../store/reducers/cluster/cluster';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {overviewApi} from '../../store/reducers/overview/overview';
import {selectSchemaObjectData} from '../../store/reducers/schema/schema';
import {TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useSetting} from '../../utils/hooks/useSetting';
import {isAccessError} from '../../utils/response';
import {useAppTitle} from '../App/AppTitleContext';

import Diagnostics from './Diagnostics/Diagnostics';
import ObjectGeneral from './ObjectGeneral/ObjectGeneral';
import {ObjectSummary} from './ObjectSummary/ObjectSummary';
import {TenantContextProvider} from './TenantContext';
import {TenantDrawerWrapper} from './TenantDrawerWrappers';
import {useTenantPage} from './TenantNavigation/useTenantNavigation';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducer,
} from './utils/paneVisibilityToggleHelpers';
import {useNavigationV2Enabled} from './utils/useNavigationV2Enabled';

import './Tenant.scss';

const b = cn('tenant-page');

interface TenantProps {
    additionalTenantProps?: AdditionalTenantsProps;
}

// eslint-disable-next-line complexity
export function Tenant({additionalTenantProps}: TenantProps) {
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useSetting<boolean>(
        DEFAULT_IS_TENANT_SUMMARY_COLLAPSED,
        false,
    );
    const useMetaProxy = useClusterWithProxy();
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = React.useReducer(
        paneVisibilityToggleReducer,
        undefined,
        () => ({
            triggerExpand: false,
            triggerCollapse: false,
            collapsed: isSummaryCollapsed,
        }),
    );

    const {database, schema} = useTenantQueryParams();

    const {name, isLoading: tenantBaseInfoLoading} = useTenantBaseInfo(database ?? '');

    if (!database) {
        throw new Error('Tenant name is not defined');
    }

    const previousTenant = React.useRef<string>();
    React.useEffect(() => {
        if (previousTenant.current !== database) {
            const register = async () => {
                const {registerYQLCompletionItemProvider} = await import(
                    '../../utils/monaco/yql/yql.completionItemProvider'
                );
                registerYQLCompletionItemProvider(database);
            };
            register().catch(console.error);
            previousTenant.current = database;
        }
    }, [database]);

    const databaseName = name ?? '';

    const path = schema ?? databaseName;

    const {
        currentData: currentItem,
        error,
        isLoading,
    } = overviewApi.useGetOverviewQuery({
        path,
        database,
        databaseFullPath: databaseName,
        useMetaProxy,
    });

    const dispatch = useTypedDispatch();
    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('tenant', {databaseName, database}));
    }, [databaseName, database, dispatch]);

    const preloadedData = useTypedSelector((state) =>
        selectSchemaObjectData(state, path, database, databaseName, useMetaProxy),
    );

    // Use preloaded data if there is no current item data yet
    const currentPathType =
        currentItem?.PathDescription?.Self?.PathType ??
        preloadedData?.PathDescription?.Self?.PathType;
    const currentPathSubType =
        currentItem?.PathDescription?.Self?.PathSubType ??
        preloadedData?.PathDescription?.Self?.PathSubType;

    const showBlockingError = isAccessError(error);

    const errorProps = showBlockingError ? uiFactory.clusterOrDatabaseAccessError : undefined;

    const onCollapseSummaryHandler = () => {
        setIsSummaryCollapsed(true);
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandSummaryHandler = () => {
        setIsSummaryCollapsed(false);
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        setIsSummaryCollapsed(false);
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.clear);
    };

    const [initialLoading, setInitialLoading] = React.useState(true);
    if (initialLoading && !isLoading && !tenantBaseInfoLoading) {
        setInitialLoading(false);
    }

    const isV2Enabled = useNavigationV2Enabled();
    const {tenantPage} = useTenantPage();
    const showDatabaseDiagnostics = isV2Enabled && tenantPage === TENANT_PAGES_IDS.diagnostics;

    const title = path || i18n('page.title');
    const {appTitle} = useAppTitle();

    const renderContent = () => {
        if (showDatabaseDiagnostics) {
            return (
                <div className={b('main')}>
                    <Diagnostics
                        database={database}
                        path={databaseName}
                        databaseFullPath={databaseName}
                        databasePagesDisplay="diagnostics"
                        additionalTenantProps={additionalTenantProps}
                    />
                </div>
            );
        }

        return (
            <SplitPane
                defaultSizePaneKey={DEFAULT_SIZE_TENANT_KEY}
                defaultSizes={[25, 75]}
                triggerCollapse={summaryVisibilityState.triggerCollapse}
                triggerExpand={summaryVisibilityState.triggerExpand}
                minSize={[36, 200]}
                onSplitStartDragAdditional={onSplitStartDragAdditional}
            >
                <ObjectSummary
                    onCollapseSummary={onCollapseSummaryHandler}
                    onExpandSummary={onExpandSummaryHandler}
                    isCollapsed={summaryVisibilityState.collapsed}
                />
                <div className={b('main')}>
                    <ObjectGeneral additionalTenantProps={additionalTenantProps} />
                </div>
            </SplitPane>
        );
    };

    return (
        <div className={b()}>
            <Helmet
                defaultTitle={`${title} — ${appTitle}`}
                titleTemplate={`%s — ${title} — ${appTitle}`}
            />
            <LoaderWrapper loading={initialLoading}>
                <PageError error={showBlockingError ? error : undefined} {...errorProps}>
                    <TenantContextProvider
                        database={database}
                        path={path}
                        type={currentPathType}
                        subType={currentPathSubType}
                        databaseFullPath={databaseName}
                    >
                        <TenantDrawerWrapper>{renderContent()}</TenantDrawerWrapper>
                    </TenantContextProvider>
                </PageError>
            </LoaderWrapper>
        </div>
    );
}
