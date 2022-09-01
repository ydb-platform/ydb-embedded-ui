import {ReactNode, useEffect, useReducer} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';

import {useThemeValue} from '@yandex-cloud/uikit';

import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {setHeader} from '../../store/reducers/header';
import {disableAutorefresh, getSchema} from '../../store/reducers/schema';
import {getSchemaAcl} from '../../store/reducers/schemaAcl';
import {getTenantInfo, clearTenant} from '../../store/reducers/tenant';
import {DEFAULT_IS_TENANT_SUMMARY_COLLAPSED, DEFAULT_SIZE_TENANT_KEY} from '../../utils/constants';
import type {TEvDescribeSchemeResult} from '../../types/api/schema';

import EmptyState from '../../components/EmptyState/EmptyState';
import {Illustration} from '../../components/Illustration';
import SplitPane from '../../components/SplitPane';

import {
    PaneVisibilityActionTypes,
    paneVisibilityToggleReducerCreator,
} from './utils/paneVisibilityToggleHelpers';

import {TenantGeneralTabsIds} from './TenantPages';
import ObjectGeneralTabs from './ObjectGeneralTabs/ObjectGeneralTabs';
import ObjectSummary from './ObjectSummary/ObjectSummary';
import QueryEditor from './QueryEditor/QueryEditor';
import Diagnostics from './Diagnostics/Diagnostics';
import Compute from './Diagnostics/Compute/Compute';

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

    const {data: {status: tenantStatus = 200} = {}} = useSelector((state: any) => state.tenant);
    const {error: {status: schemaStatus = 200} = {}} = useSelector((state: any) => state.schema);

    const dispatch = useDispatch();

    const location = useLocation();

    const theme = useThemeValue();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name, general} = queryParams;
    const tenantName = name as string;
    const generalTab = general as string;

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

    const {
        PathType: currentPathType,
        PathSubType: currentPathSubType,
    } = (currentItem as TEvDescribeSchemeResult).PathDescription?.Self || {};

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

    const renderSplitPane = (children: ReactNode) => (
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
                onCollapseSummary={onCollapseSummaryHandler}
                onExpandSummary={onExpandSummaryHandler}
                isCollapsed={summaryVisibilityState.collapsed}
                additionalTenantInfo={props.additionalTenantInfo}
            />
            <div className={b('split-pane-warpper')}>
                {children}
            </div>
        </SplitPane>
    );

    const renderTabContent = () => {
        const {additionalTenantInfo, additionalNodesInfo} = props;

        switch (generalTab) {
            case TenantGeneralTabsIds.query:
                return renderSplitPane(
                    <QueryEditor path={tenantName as string} theme={theme} type={currentPathType} />
                );
            case TenantGeneralTabsIds.nodes:
                return (
                    <Compute additionalNodesInfo={additionalNodesInfo} />
                );
            default:
                return renderSplitPane(
                    <Diagnostics
                        type={currentPathType}
                        additionalTenantInfo={additionalTenantInfo}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                );
        }
    }

    return (
        <div className={b()}>
            {showBlockingError ? (
                <EmptyState
                    image={<Illustration name="403" />}
                    title="Access denied"
                    description="You don’t have the necessary roles to view this page."
                />
            ) : (
                <>
                    <ObjectGeneralTabs />
                    <div className={b('tab-content')}>
                        {renderTabContent()}
                    </div>
                </>
            )}
        </div>
    );
}

export default Tenant;
