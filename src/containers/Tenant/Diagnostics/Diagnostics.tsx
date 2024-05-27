import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {useLocation} from 'react-router';
import {Link} from 'react-router-dom';

import {Loader} from '../../../components/Loader';
import {enrichQueryParams} from '../../../routes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {Heatmap} from '../../Heatmap';
import {NodesWrapper} from '../../Nodes/NodesWrapper';
import {StorageWrapper} from '../../Storage/StorageWrapper';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {TenantTabsGroups} from '../TenantPages';
import {isDatabaseEntityType} from '../utils/schema';

import {AutorefreshControl} from './Autorefresh/AutorefreshControl';
import {Consumers} from './Consumers';
import Describe from './Describe/Describe';
import DetailedOverview from './DetailedOverview/DetailedOverview';
import {DATABASE_PAGES, getPagesByType} from './DiagnosticsPages';
import {HotKeys} from './HotKeys/HotKeys';
import {Network} from './Network/Network';
import {Partitions} from './Partitions/Partitions';
import {Tablets} from './Tablets/Tablets';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';

import './Diagnostics.scss';

interface DiagnosticsProps {
    type?: EPathType;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-tenant-diagnostics');

const pagesQueryParams = ['search', 'uptimeFilter', 'usageFilter', 'type', 'visible'];

function Diagnostics(props: DiagnosticsProps) {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();
    const {currentSchemaPath, wasLoaded} = useTypedSelector((state) => state.schema);
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    for (const key of pagesQueryParams) {
        queryParams.delete(key);
    }

    const rootTenantName = queryParams.get('name');
    const tenantName = isDatabaseEntityType(props.type) ? currentSchemaPath : rootTenantName;
    const isDatabase = isDatabaseEntityType(props.type) || currentSchemaPath === rootTenantName;

    const pages = React.useMemo(() => {
        if (isDatabase) {
            return DATABASE_PAGES;
        }

        return getPagesByType(props.type);
    }, [props.type, isDatabase]);

    const forwardToDiagnosticTab = (tab: TenantDiagnosticsTab) => {
        dispatch(setDiagnosticsTab(tab));
    };
    const activeTab = React.useMemo(() => {
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
            case TENANT_DIAGNOSTICS_TABS_IDS.schema: {
                return <SchemaViewer path={currentSchemaPath} type={type} withFamilies />;
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
                // @ts-expect-error
                return <HotKeys path={currentSchemaPath} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
                // @ts-expect-error
                return <Heatmap path={currentSchemaPath} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
                // @ts-expect-error
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
                            const q = enrichQueryParams(queryParams);
                            q.set(TenantTabsGroups.diagnosticsTab, id);
                            return (
                                <Link
                                    to={{...location, search: q.toString()}}
                                    key={id}
                                    className={b('tab')}
                                >
                                    {node}
                                </Link>
                            );
                        }}
                        allowNotSelected={true}
                    />
                    <AutorefreshControl />
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
