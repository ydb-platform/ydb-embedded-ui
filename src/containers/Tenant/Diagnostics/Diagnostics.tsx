import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {Link} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import {AutoRefreshControl} from '../../../components/AutoRefreshControl/AutoRefreshControl';
import routes, {createHref} from '../../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {Heatmap} from '../../Heatmap';
import {NodesWrapper} from '../../Nodes/NodesWrapper';
import {StorageWrapper} from '../../Storage/StorageWrapper';
import {Tablets} from '../../Tablets';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {TenantTabsGroups} from '../TenantPages';
import {isDatabaseEntityType} from '../utils/schema';

import {Consumers} from './Consumers';
import Describe from './Describe/Describe';
import DetailedOverview from './DetailedOverview/DetailedOverview';
import {DATABASE_PAGES, getPagesByType} from './DiagnosticsPages';
import {HotKeys} from './HotKeys/HotKeys';
import {Network} from './Network/Network';
import {Partitions} from './Partitions/Partitions';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';

import './Diagnostics.scss';

interface DiagnosticsProps {
    type?: EPathType;
    tenantName: string;
    path: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-tenant-diagnostics');

function Diagnostics(props: DiagnosticsProps) {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const [queryParams] = useQueryParams({
        name: StringParam,
        schema: StringParam,
        backend: StringParam,
        clusterName: StringParam,
    });

    const tenantName = isDatabaseEntityType(props.type) ? props.path : props.tenantName;
    const isDatabase = isDatabaseEntityType(props.type) || props.path === props.tenantName;

    const pages = isDatabase ? DATABASE_PAGES : getPagesByType(props.type);
    let activeTab = pages.find((el) => el.id === diagnosticsTab);
    if (!activeTab) {
        activeTab = pages[0];
    }

    React.useEffect(() => {
        if (activeTab && activeTab.id !== diagnosticsTab) {
            dispatch(setDiagnosticsTab(activeTab.id));
        }
    }, [activeTab, diagnosticsTab, dispatch]);

    const renderTabContent = () => {
        const {type, path} = props;

        switch (activeTab?.id) {
            case TENANT_DIAGNOSTICS_TABS_IDS.overview: {
                return (
                    <DetailedOverview
                        type={type}
                        tenantName={tenantName}
                        path={path}
                        additionalTenantProps={props.additionalTenantProps}
                        additionalNodesProps={props.additionalNodesProps}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.schema: {
                return <SchemaViewer path={path} tenantName={tenantName} type={type} extended />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topQueries: {
                return <TopQueries tenantName={tenantName} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topShards: {
                return <TopShards tenantName={tenantName} path={path} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.nodes: {
                return (
                    <NodesWrapper
                        path={path}
                        additionalNodesProps={props.additionalNodesProps}
                        parentContainer={container.current}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.tablets: {
                return <Tablets path={path} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.storage: {
                return <StorageWrapper tenant={tenantName} parentContainer={container.current} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.network: {
                return <Network tenantName={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.describe: {
                return <Describe path={path} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.hotKeys: {
                return <HotKeys path={path} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
                return <Heatmap path={path} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
                return <Consumers path={path} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.partitions: {
                return <Partitions path={path} />;
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
                        activeTab={activeTab?.id}
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
                    <AutoRefreshControl />
                </div>
            </div>
        );
    };

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
