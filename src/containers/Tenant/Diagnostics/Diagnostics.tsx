import {useMemo, useRef} from 'react';
import qs from 'qs';
import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation} from 'react-router';
import {Helmet} from 'react-helmet-async';

import {Switch, Tabs} from '@gravity-ui/uikit';

import type {EPathType} from '../../../types/api/schema';
import type {AdditionalTenantsProps, AdditionalNodesProps} from '../../../types/additionalProps';

import {useTypedSelector} from '../../../utils/hooks';
import routes, {createHref} from '../../../routes';
import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import {enableAutorefresh, disableAutorefresh} from '../../../store/reducers/schema/schema';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';

import {Loader} from '../../../components/Loader';

import {Heatmap} from '../../Heatmap';
import {NodesWrapper} from '../../Nodes/NodesWrapper';
import {StorageWrapper} from '../../Storage/StorageWrapper';
import {Tablets} from '../../Tablets';

import Describe from './Describe/Describe';
import {HotKeys} from './HotKeys/HotKeys';
import Network from './Network/Network';
import {Partitions} from './Partitions/Partitions';
import {Consumers} from './Consumers';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import DetailedOverview from './DetailedOverview/DetailedOverview';

import {isDatabaseEntityType} from '../utils/schema';

import {TenantTabsGroups} from '../TenantPages';
import {DATABASE_PAGES, getPagesByType} from './DiagnosticsPages';

import './Diagnostics.scss';

interface DiagnosticsProps {
    type?: EPathType;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-tenant-diagnostics');

function Diagnostics(props: DiagnosticsProps) {
    const container = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();
    const {currentSchemaPath, autorefresh, wasLoaded} = useSelector((state: any) => state.schema);
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: rootTenantName} = queryParams;
    const tenantName = isDatabaseEntityType(props.type) ? currentSchemaPath : rootTenantName;
    const isDatabase = isDatabaseEntityType(props.type) || currentSchemaPath === rootTenantName;

    const pages = useMemo(() => {
        if (isDatabase) {
            return DATABASE_PAGES;
        }

        return getPagesByType(props.type);
    }, [props.type, isDatabase]);

    const forwardToDiagnosticTab = (tab: TenantDiagnosticsTab) => {
        dispatch(setDiagnosticsTab(tab));
    };
    const activeTab = useMemo(() => {
        if (wasLoaded) {
            let page = pages.find((el) => el.id === diagnosticsTab);
            if (!page) {
                page = pages[0];
            }
            if (page && page.id !== diagnosticsTab) {
                forwardToDiagnosticTab(page.id);
            }
            return page;
        }
        return undefined;
    }, [pages, diagnosticsTab, wasLoaded]);

    const onAutorefreshToggle = (value: boolean) => {
        if (value) {
            dispatch(enableAutorefresh());
        } else {
            dispatch(disableAutorefresh());
        }
    };

    const renderTabContent = () => {
        const {type} = props;

        const tenantNameString = tenantName as string;

        switch (activeTab?.id) {
            case TENANT_DIAGNOSTICS_TABS_IDS.overview: {
                return (
                    <DetailedOverview
                        type={type}
                        tenantName={tenantNameString}
                        additionalTenantProps={props.additionalTenantProps}
                        additionalNodesProps={props.additionalNodesProps}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topQueries: {
                return <TopQueries path={tenantNameString} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topShards: {
                return <TopShards tenantPath={tenantNameString} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.nodes: {
                return (
                    <NodesWrapper
                        path={currentSchemaPath}
                        additionalNodesProps={props.additionalNodesProps}
                        parentContainer={container.current}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.tablets: {
                return <Tablets path={currentSchemaPath} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.storage: {
                return (
                    <StorageWrapper tenant={tenantNameString} parentContainer={container.current} />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.network: {
                return <Network path={tenantNameString} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.describe: {
                return <Describe tenant={tenantNameString} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.hotKeys: {
                return <HotKeys path={currentSchemaPath} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
                return <Heatmap path={currentSchemaPath} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
                return <Consumers path={currentSchemaPath} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.partitions: {
                return <Partitions path={currentSchemaPath} />;
            }
            default: {
                return <div>No data...</div>;
            }
        }
    };
    const renderTabs = () => {
        return (
            <div className={b('header-wrapper')}>
                <div className={b('tabs')}>
                    <Tabs
                        size="l"
                        items={pages}
                        activeTab={activeTab?.id as string}
                        wrapTo={({id}, node) => {
                            const path = createHref(routes.tenant, undefined, {
                                ...queryParams,
                                [TenantTabsGroups.diagnosticsTab]: id,
                            });

                            return (
                                <Link to={path} key={id} className={b('tab')}>
                                    {node}
                                </Link>
                            );
                        }}
                        allowNotSelected={true}
                    />
                    <Switch
                        checked={autorefresh}
                        onUpdate={onAutorefreshToggle}
                        content="Autorefresh"
                    />
                </div>
            </div>
        );
    };

    // Loader prevents incorrect loading of tabs
    // After tabs are initially loaded it is no longer needed
    // Thus there is no also "loading" check as in other parts of the project
    if (!wasLoaded) {
        return <Loader size="l" />;
    }

    return (
        <div className={b()} ref={container}>
            {activeTab ? (
                <Helmet>
                    <title>{activeTab.title}</title>
                </Helmet>
            ) : null}
            {renderTabs()}
            <div className={b('page-wrapper')}>{renderTabContent()}</div>
        </div>
    );
}

export default Diagnostics;
