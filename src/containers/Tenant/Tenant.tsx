import React from 'react';

import qs from 'qs';
import {Helmet} from 'react-helmet-async';
import {useLocation} from 'react-router';

import {AccessDenied} from '../../components/Errors/403';
import SplitPane from '../../components/SplitPane';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {getSchema} from '../../store/reducers/schema/schema';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../types/additionalProps';
import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import {cn} from '../../utils/cn';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

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

function Tenant(props: TenantProps) {
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = React.useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        undefined,
        getTenantSummaryState,
    );
    const previousTenant = React.useRef<string>();

    const {currentSchemaPath, currentSchema: currentItem = {}} = useTypedSelector(
        (state) => state.schema,
    );

    const {PathType: preloadedPathType, PathSubType: preloadedPathSubType} =
        useTypedSelector((state) =>
            currentSchemaPath
                ? state.schema.data[currentSchemaPath]?.PathDescription?.Self
                : undefined,
        ) || {};

    const {PathType: currentPathType, PathSubType: currentPathSubType} =
        (currentItem as TEvDescribeSchemeResult).PathDescription?.Self || {};

    const {error: {status: schemaStatus = 200} = {}} = useTypedSelector((state) => state.schema);

    const dispatch = useTypedDispatch();

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name} = queryParams;
    const tenantName = name as string;

    React.useEffect(() => {
        if (tenantName && typeof tenantName === 'string' && previousTenant.current !== tenantName) {
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

    React.useEffect(() => {
        dispatch(getSchema({path: tenantName}));
    }, [tenantName, dispatch]);

    React.useEffect(() => {
        //TODO: should be refactored when move to @reduxjs/toolkit/query
        if (currentSchemaPath && currentSchemaPath !== tenantName) {
            dispatch(getSchema({path: currentSchemaPath}));
        }
    }, [currentSchemaPath, dispatch, tenantName]);

    React.useEffect(() => {
        if (tenantName) {
            dispatch(setHeaderBreadcrumbs('tenant', {tenantName}));
        }
    }, [tenantName, dispatch]);

    const onCollapseSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDragAdditional = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.clear);
    };

    const showBlockingError = schemaStatus === 403;

    const title = currentSchemaPath || tenantName || i18n('page.title');
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
                        type={preloadedPathType || currentPathType}
                        subType={preloadedPathSubType || currentPathSubType}
                        tenantName={tenantName}
                        onCollapseSummary={onCollapseSummaryHandler}
                        onExpandSummary={onExpandSummaryHandler}
                        isCollapsed={summaryVisibilityState.collapsed}
                    />
                    <ObjectGeneral
                        type={preloadedPathType || currentPathType}
                        additionalTenantProps={props.additionalTenantProps}
                        additionalNodesProps={props.additionalNodesProps}
                        tenantName={tenantName}
                    />
                </SplitPane>
            )}
        </div>
    );
}

export default Tenant;
