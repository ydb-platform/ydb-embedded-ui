import {useEffect, useReducer, useRef} from 'react';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';
import {Helmet} from 'react-helmet-async';

import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import type {AdditionalTenantsProps, AdditionalNodesProps} from '../../types/additionalProps';

import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedSelector, useTypedDispatch} from '../../utils/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {disableAutorefresh, getSchema} from '../../store/reducers/schema/schema';

import SplitPane from '../../components/SplitPane';
import {AccessDenied} from '../../components/Errors/403';

import {ObjectSummary} from './ObjectSummary/ObjectSummary';
import ObjectGeneral from './ObjectGeneral/ObjectGeneral';

import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from './utils/paneVisibilityToggleHelpers';
import i18n from './i18n';

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
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        undefined,
        getTenantSummaryState,
    );
    const previousTenant = useRef<string>();

    const {currentSchemaPath, currentSchema: currentItem = {}} = useTypedSelector(
        (state) => state.schema,
    );

    const {PathType: preloadedPathType, PathSubType: preloadedPathSubType} = useTypedSelector(
        (state) =>
            currentSchemaPath
                ? state.schema.data[currentSchemaPath]?.PathDescription?.Self || {}
                : {},
    );

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

    useEffect(() => {
        if (tenantName && typeof tenantName === 'string' && previousTenant.current !== tenantName) {
            const register = async () => {
                const {registerYQLCompletionItemProvider} = await import(
                    '../../utils/monaco/yqlSuggestions/registerCompletionItemProvider'
                );
                registerYQLCompletionItemProvider(tenantName);
            };
            register().catch(console.error);
            previousTenant.current = tenantName;
        }
    }, [tenantName]);

    useEffect(() => {
        dispatch(getSchema({path: tenantName}));
    }, [tenantName, dispatch]);

    useEffect(() => {
        if (currentSchemaPath) {
            dispatch(getSchema({path: currentSchemaPath}));
        }
    }, [currentSchemaPath, dispatch]);

    useEffect(() => {
        dispatch(disableAutorefresh());
    }, [currentSchemaPath, tenantName, dispatch]);

    useEffect(() => {
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
                        onCollapseSummary={onCollapseSummaryHandler}
                        onExpandSummary={onExpandSummaryHandler}
                        isCollapsed={summaryVisibilityState.collapsed}
                    />
                    <ObjectGeneral
                        // @ts-expect-error
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
