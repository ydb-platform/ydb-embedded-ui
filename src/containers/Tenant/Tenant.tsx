import {useEffect, useReducer} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';

import {AccessDenied} from '../../components/Errors/403';

import {setHeader} from '../../store/reducers/header';
import ObjectGeneralTabs from './ObjectGeneralTabs/ObjectGeneralTabs';
import ObjectSummary from './ObjectSummary/ObjectSummary';
import ObjectGeneral from './ObjectGeneral/ObjectGeneral';
//@ts-ignore
import SplitPane from '../../components/SplitPane';
//@ts-ignore
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
//@ts-ignore
import {disableAutorefresh, getSchema, resetLoadingState} from '../../store/reducers/schema';
//@ts-ignore
import {getSchemaAcl} from '../../store/reducers/schemaAcl';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from './utils/paneVisibilityToggleHelpers';
//@ts-ignore
import {getTenantInfo, clearTenant} from '../../store/reducers/tenant';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import type {TEvDescribeSchemeResult} from '../../types/api/schema';

import './Tenant.scss';

const b = cn('tenant-page');

const getInitialIsSummaryCollapsed = () => {
    return Boolean(localStorage.getItem(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED));
};

const initialTenantSummaryState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: getInitialIsSummaryCollapsed(),
};

interface TenantProps {
    additionalTenantInfo?: any;
    additionalNodesInfo?: any;
}

function Tenant(props: TenantProps) {
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        initialTenantSummaryState,
    );

    const {currentSchemaPath, currentSchema: currentItem = {}} = useSelector(
        (state: any) => state.schema,
    );

    const {PathType: preloadedPathType, PathSubType: preloadedPathSubType} = useSelector(
        (state: any) => state.schema.data[currentSchemaPath]?.PathDescription?.Self || {},
    );

    const {PathType: currentPathType, PathSubType: currentPathSubType} =
        (currentItem as TEvDescribeSchemeResult).PathDescription?.Self || {};

    const {data: {status: tenantStatus = 200} = {}} = useSelector((state: any) => state.tenant);
    const {error: {status: schemaStatus = 200} = {}} = useSelector((state: any) => state.schema);

    const dispatch = useDispatch();

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name} = queryParams;
    const tenantName = name as string;

    useEffect(() => {
        dispatch(getSchema({path: tenantName}));
        dispatch(getSchemaAcl({path: tenantName}));
    }, [tenantName, dispatch]);

    useEffect(() => {
        dispatch(resetLoadingState());
        dispatch(getSchema({path: currentSchemaPath}));
        dispatch(getSchemaAcl({path: currentSchemaPath}));
    }, [currentSchemaPath, dispatch]);

    useEffect(() => {
        dispatch(disableAutorefresh());
    }, [currentSchemaPath, tenantName, dispatch]);

    useEffect(() => {
        if (tenantName) {
            dispatch(getTenantInfo({path: tenantName}));
            dispatch(
                setHeader([
                    {
                        text: CLUSTER_PAGES.tenants.title,
                        link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.tenants.id}),
                    },
                    {
                        text: tenantName.startsWith('/') ? tenantName.slice(1) : tenantName,
                        link: createHref(routes.tenant, undefined, {
                            name: tenantName,
                        }),
                    },
                ]),
            );
        }
        return () => {
            dispatch(clearTenant());
        };
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

    const showBlockingError = tenantStatus === 403 || schemaStatus === 403;

    return (
        <div className={b()}>
            {showBlockingError ? (
                <AccessDenied />
            ) : (
                <>
                    <ObjectGeneralTabs />
                    <div className={b('tab-content')}>
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
                                additionalTenantInfo={props.additionalTenantInfo}
                            />
                            <ObjectGeneral
                                type={preloadedPathType || currentPathType}
                                additionalTenantInfo={props.additionalTenantInfo}
                                additionalNodesInfo={props.additionalNodesInfo}
                            />
                        </SplitPane>
                    </div>
                </>
            )}
        </div>
    );
}

export default Tenant;
