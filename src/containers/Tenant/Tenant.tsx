import {useEffect, useMemo, useReducer} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';

import ObjectSummary from './ObjectSummary/ObjectSummary';
import {setHeader} from '../../store/reducers/header';
import ObjectGeneral from './ObjectGeneral/ObjectGeneral';
//@ts-ignore
import SplitPane from '../../components/SplitPane';
//@ts-ignore
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
//@ts-ignore
import {disableAutorefresh, getSchema} from '../../store/reducers/schema';
//@ts-ignore
import {getSchemaAcl} from '../../store/reducers/schemaAcl';
import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from './utils/paneVisibilityToggleHelpers';
//@ts-ignore
import {getTenantInfo, clearTenant} from '../../store/reducers/tenant';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import './Tenant.scss';

const b = cn('tenant-page');

export const TABLE_TYPE = 'Table';
export const OLAP_TABLE_TYPE = 'OlapTable';
export const OLAP_STORE_TYPE = 'OlapStore';

export function calcEntityType(currentPathType?: string) {
    return currentPathType && currentPathType.replace('EPathType', '');
}

export function isTableType(currentPathType?: string) {
    const type = calcEntityType(currentPathType);

    if (type === TABLE_TYPE || type === OLAP_TABLE_TYPE) {
        return true;
    }
    return false;
}

const getInitialIsSummaryCollapsed = () => {
    return Boolean(localStorage.getItem(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED));
};

const initialTenantSummaryState = {
    triggerExpand: false,
    triggerCollapse: false,
    collapsed: getInitialIsSummaryCollapsed(),
};

interface TenantProps {
    additionalTenantInfo: any;
    additionalNodesInfo: any;
}

function Tenant(props: TenantProps) {
    const [summaryVisibilityState, dispatchSummaryVisibilityAction] = useReducer(
        paneVisibilityToggleReducerCreator(DEFAULT_IS_TENANT_SUMMARY_COLLAPSED),
        initialTenantSummaryState,
    );

    const {currentSchemaPath, currentSchema: currentItem = {}} = useSelector(
        (state: any) => state.schema,
    );

    const dispatch = useDispatch();

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name} = queryParams;
    const tenantName = name as string;

    useEffect(() => {
        const schemaPath = currentSchemaPath || tenantName;
        dispatch(getSchema({path: tenantName}));
        dispatch(getSchema({path: schemaPath}));
        dispatch(getSchemaAcl({path: schemaPath}));
    }, [tenantName, currentSchemaPath, dispatch]);

    useEffect(() => {
        dispatch(disableAutorefresh());
    }, [currentSchemaPath, tenantName]);

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

    const currentPathType = currentItem.PathDescription?.Self?.PathType;

    const entityType = useMemo(() => {
        return calcEntityType(currentPathType);
    }, [currentPathType]);

    const onCollapseSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerCollapse);
    };
    const onExpandSummaryHandler = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.triggerExpand);
    };

    const onSplitStartDrugAdditional = () => {
        dispatchSummaryVisibilityAction(PaneVisibilityActionTypes.clear);
    };

    return (
        <div className={b()}>
            <SplitPane
                defaultSizePaneKey={DEFAULT_SIZE_TENANT_KEY}
                defaultSizes={[25, 75]}
                triggerCollapse={summaryVisibilityState.triggerCollapse}
                triggerExpand={summaryVisibilityState.triggerExpand}
                minSize={[36, 200]}
                onSplitStartDrugAdditional={onSplitStartDrugAdditional}
            >
                <ObjectSummary
                    type={entityType as string}
                    onCollapseSummary={onCollapseSummaryHandler}
                    onExpandSummary={onExpandSummaryHandler}
                    isCollapsed={summaryVisibilityState.collapsed}
                    additionalTenantInfo={props.additionalTenantInfo}
                />
                <ObjectGeneral
                    type={entityType as string}
                    additionalTenantInfo={props.additionalTenantInfo}
                    additionalNodesInfo={props.additionalNodesInfo}
                />
            </SplitPane>
        </div>
    );
}

export default Tenant;
