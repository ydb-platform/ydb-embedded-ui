import React from 'react';

import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import SplitPane from '../../components/SplitPane';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {overviewApi} from '../../store/reducers/overview/overview';
import {selectSchemaObjectData} from '../../store/reducers/schema/schema';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {isAccessError} from '../../utils/response';

import ObjectGeneral from './ObjectGeneral/ObjectGeneral';
import {ObjectSummary} from './ObjectSummary/ObjectSummary';
import i18n from './i18n';
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

export function Tenant(props: TenantProps) {
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        undefined,
        getTenantSummaryState,
    );

    // TODO: name is used together with database to keep old links valid
    // Remove it after some time - 1-2 weeks
    const [{database, name, schema}, setQuery] = useQueryParams({
        database: StringParam,
        name: StringParam,
        schema: StringParam,
    });

    React.useEffect(() => {
        if (name && !database) {
            setQuery({database: name, name: undefined}, 'replaceIn');
        }
    }, [database, name, setQuery]);

    const tenantName = database ?? name;

    if (!tenantName) {
        throw new Error('Tenant name is not defined');
    }

    const previousTenant = React.useRef<string>();
    React.useEffect(() => {
        if (previousTenant.current !== tenantName) {
            const register = async () => {
                const {registerYQLCompletionItemProvider} = await import(
                    '../../utils/monaco/yql/yql.completionItemProvider'
                );
                registerYQLCompletionItemProvider(tenantName);
            };
            register().catch(console.error);
            previousTenant.current = tenantName;
        }
    }, [tenantName]);

    const dispatch = useTypedDispatch();
    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('tenant', {tenantName}));
    }, [tenantName, dispatch]);

    const path = schema ?? tenantName;

    const {
        currentData: currentItem,
        error,
        isLoading,
    } = overviewApi.useGetOverviewQuery({path, database: tenantName});

    const preloadedData = useTypedSelector((state) =>
        selectSchemaObjectData(state, path, tenantName),
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
    return (
        <div className={b()}>
            <Helmet
                defaultTitle={`${title} — YDB Monitoring`}
                titleTemplate={`%s — ${title} — YDB Monitoring`}
            />
            <LoaderWrapper loading={initialLoading}>
                <PageError error={showBlockingError ? error : undefined}>
                    <SplitPane
                        defaultSizePaneKey={DEFAULT_SIZE_TENANT_KEY}
                        defaultSizes={[25, 75]}
                        triggerCollapse={summaryVisibilityState.triggerCollapse}
                        triggerExpand={summaryVisibilityState.triggerExpand}
                        minSize={[36, 200]}
                        onSplitStartDragAdditional={onSplitStartDragAdditional}
                    >
                        <ObjectSummary
                            type={currentPathType}
                            subType={currentPathSubType}
                            tenantName={tenantName}
                            path={path}
                            onCollapseSummary={onCollapseSummaryHandler}
                            onExpandSummary={onExpandSummaryHandler}
                            isCollapsed={summaryVisibilityState.collapsed}
                        />
                        <div className={b('main')}>
                            <ObjectGeneral
                                type={currentPathType}
                                subType={currentPathSubType}
                                additionalTenantProps={props.additionalTenantProps}
                                additionalNodesProps={props.additionalNodesProps}
                                tenantName={tenantName}
                                path={path}
                            />
                        </div>
                    </SplitPane>
                </PageError>
            </LoaderWrapper>
        </div>
    );
}
