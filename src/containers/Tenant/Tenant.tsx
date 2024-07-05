import React from 'react';

import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {AccessDenied} from '../../components/Errors/403';
import {Loader} from '../../components/Loader';
import SplitPane from '../../components/SplitPane';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {schemaApi} from '../../store/reducers/schema/schema';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedDispatch} from '../../utils/hooks';

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

    const [{name: tenantName, schema}] = useQueryParams({name: StringParam, schema: StringParam});

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
    } = schemaApi.useGetSchemaQuery({path}, {refetchOnMountOrArgChange: true});
    const {PathType: currentPathType, PathSubType: currentPathSubType} =
        currentItem?.PathDescription?.Self || {};

    let showBlockingError = false;
    if (error && typeof error === 'object' && 'status' in error) {
        showBlockingError = error.status === 403;
    }

    const onCollapseSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.clear);
    };

    const title = path || i18n('page.title');
    return (
        <div className={b()}>
            <Helmet
                defaultTitle={`${title} — YDB Monitoring`}
                titleTemplate={`%s — ${title} — YDB Monitoring`}
            />
            {showBlockingError ? (
                <AccessDenied />
            ) : (
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
                        {isLoading ? (
                            <Loader size="l" />
                        ) : (
                            <ObjectGeneral
                                type={currentPathType}
                                additionalTenantProps={props.additionalTenantProps}
                                additionalNodesProps={props.additionalNodesProps}
                                tenantName={tenantName}
                                path={path}
                            />
                        )}
                    </div>
                </SplitPane>
            )}
        </div>
    );
}
