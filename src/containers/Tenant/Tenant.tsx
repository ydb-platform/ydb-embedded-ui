import React from 'react';

import {Helmet} from 'react-helmet-async';

import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import SplitPane from '../../components/SplitPane';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {overviewApi} from '../../store/reducers/overview/overview';
import {selectSchemaObjectData} from '../../store/reducers/schema/schema';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../types/additionalProps';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {isAccessError} from '../../utils/response';
import {useAppTitle} from '../App/AppTitleContext';

import ObjectGeneral from './ObjectGeneral/ObjectGeneral';
import {ObjectSummary} from './ObjectSummary/ObjectSummary';
import {TenantContextProvider} from './TenantContext';
import {TenantDrawerWrapper} from './TenantDrawerWrappers';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from './utils/paneVisibilityToggleHelpers';

import './Tenant.scss';

const b = cn('tenant-page');

const getTenantSummaryState = () => {
    const collapsed = Boolean(localStorage.getItem(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED));

    return {
        triggerExpand: false,
        triggerCollapse: false,
        collapsed,
    };
};

interface TenantProps {
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

// eslint-disable-next-line complexity
export function Tenant(props: TenantProps) {
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        undefined,
        getTenantSummaryState,
    );

    const {database, schema} = useTenantQueryParams();

    const {controlPlane, name} = useTenantBaseInfo(database ?? '');

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

    const path = schema ?? database;

    const {
        currentData: currentItem,
        error,
        isLoading,
    } = overviewApi.useGetOverviewQuery({path, database: database});

    const databaseName = name ?? controlPlane?.name ?? database;

    const dispatch = useTypedDispatch();
    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('tenant', {tenantName: databaseName, database}));
    }, [databaseName, database, dispatch]);

    const preloadedData = useTypedSelector((state) =>
        selectSchemaObjectData(state, path, database),
    );

    // Use preloaded data if there is no current item data yet
    const currentPathType =
        currentItem?.PathDescription?.Self?.PathType ??
        preloadedData?.PathDescription?.Self?.PathType;
    const currentPathSubType =
        currentItem?.PathDescription?.Self?.PathSubType ??
        preloadedData?.PathDescription?.Self?.PathSubType;

    const showBlockingError = isAccessError(error);

    const onCollapseSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.clear);
    };

    const [initialLoading, setInitialLoading] = React.useState(true);
    if (initialLoading && !isLoading) {
        setInitialLoading(false);
    }

    const title = path || i18n('page.title');
    const {appTitle} = useAppTitle();
    return (
        <div className={b()}>
            <Helmet
                defaultTitle={`${title} — ${appTitle}`}
                titleTemplate={`%s — ${title} — ${appTitle}`}
            />
            <LoaderWrapper loading={initialLoading}>
                <PageError
                    error={showBlockingError ? error : undefined}
                    {...uiFactory.clusterOrDatabaseAccessError}
                >
                    <TenantContextProvider
                        database={database}
                        path={path}
                        type={currentPathType}
                        subType={currentPathSubType}
                        databaseFullPath={databaseName}
                    >
                        <TenantDrawerWrapper>
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
                                    <ObjectGeneral
                                        additionalTenantProps={props.additionalTenantProps}
                                        additionalNodesProps={props.additionalNodesProps}
                                    />
                                </div>
                            </SplitPane>
                        </TenantDrawerWrapper>
                    </TenantContextProvider>
                </PageError>
            </LoaderWrapper>
        </div>
    );
}
