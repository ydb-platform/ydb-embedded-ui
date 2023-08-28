import {useEffect, useReducer} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';

import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import type {AdditionalTenantsProps, AdditionalNodesProps} from '../../types/additionalProps';

import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks';
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
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
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

    const {error: {status: schemaStatus = 200} = {}} = useTypedSelector((state) => state.schema);

    const dispatch = useDispatch();

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name} = queryParams;
    const tenantName = name as string;

    useEffect(() => {
        dispatch(getSchema({path: tenantName}));
    }, [tenantName, dispatch]);

    useEffect(() => {
        dispatch(getSchema({path: currentSchemaPath}));
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

    return (
        <div className={b()}>
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
                        type={preloadedPathType || currentPathType}
                        additionalTenantProps={props.additionalTenantProps}
                        additionalNodesProps={props.additionalNodesProps}
                    />
                </SplitPane>
            )}
        </div>
    );
}

export default Tenant;
