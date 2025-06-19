import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {Link} from 'react-router-dom';

import {AutoRefreshControl} from '../../../components/AutoRefreshControl/AutoRefreshControl';
import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {
    useFeatureFlagsAvailable,
    useTopicDataAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab} from '../../../store/reducers/tenant/tenant';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {Heatmap} from '../../Heatmap';
import {Nodes} from '../../Nodes/Nodes';
import {Operations} from '../../Operations';
import {PaginatedStorage} from '../../Storage/PaginatedStorage';
import {Tablets} from '../../Tablets/Tablets';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {isDatabaseEntityType} from '../utils/schema';

import {Configs} from './Configs/Configs';
import {Consumers} from './Consumers';
import Describe from './Describe/Describe';
import DetailedOverview from './DetailedOverview/DetailedOverview';
import {getPagesByType, useDiagnosticsPageLinkGetter} from './DiagnosticsPages';
import {HotKeys} from './HotKeys/HotKeys';
import {NetworkWrapper} from './Network/NetworkWrapper';
import {Partitions} from './Partitions/Partitions';
import {TopQueries} from './TopQueries';
import {TopShards} from './TopShards';
import {TopicData} from './TopicData/TopicData';

import './Diagnostics.scss';

interface DiagnosticsProps {
    type?: EPathType;
    subType?: EPathSubType;
    tenantName: string;
    path: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-tenant-diagnostics');

function Diagnostics(props: DiagnosticsProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const tenantName = isDatabaseEntityType(props.type) ? props.path : props.tenantName;

    const hasFeatureFlags = useFeatureFlagsAvailable();
    const hasTopicData = useTopicDataAvailable();
    const pages = getPagesByType(props.type, props.subType, {
        hasFeatureFlags,
        hasTopicData,
        isTopLevel: props.path === props.tenantName,
    });
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
                return <TopQueries tenantName={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topShards: {
                return <TopShards tenantName={tenantName} path={path} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.nodes: {
                return (
                    <Nodes
                        path={path}
                        database={tenantName}
                        additionalNodesProps={props.additionalNodesProps}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.tablets: {
                return (
                    <Tablets scrollContainerRef={containerRef} path={path} database={tenantName} />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.storage: {
                return <PaginatedStorage database={tenantName} scrollContainerRef={containerRef} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.network: {
                return (
                    <NetworkWrapper
                        path={path}
                        database={tenantName}
                        additionalNodesProps={props.additionalNodesProps}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.describe: {
                return <Describe path={path} database={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.hotKeys: {
                return <HotKeys path={path} database={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
                return <Heatmap path={path} database={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
                return <Consumers path={path} database={tenantName} type={type} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.partitions: {
                return <Partitions path={path} database={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topicData: {
                return (
                    <TopicData
                        key={path}
                        path={path}
                        database={tenantName}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.configs: {
                return <Configs database={tenantName} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.operations: {
                return <Operations database={tenantName} />;
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
                            const path = getDiagnosticsPageLink(id);

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
        <div className={b()}>
            {activeTab ? (
                <Helmet>
                    <title>{activeTab.title}</title>
                </Helmet>
            ) : null}
            {renderTabs()}
            <DrawerContextProvider>
                <div className={b('page-wrapper')} ref={containerRef}>
                    {renderTabContent()}
                </div>
            </DrawerContextProvider>
        </div>
    );
}

export default Diagnostics;
