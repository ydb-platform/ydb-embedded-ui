import React from 'react';

import {Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {AutoRefreshControl} from '../../../components/AutoRefreshControl/AutoRefreshControl';
import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import {InternalLink} from '../../../components/InternalLink';
import {
    useFeatureFlagsAvailable,
    useTopicDataAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {useScrollPosition, useTypedDispatch, useTypedSelector} from '../../../utils/hooks';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {Configs} from '../../Configs/Configs';
import {Heatmap} from '../../Heatmap';
import {Nodes} from '../../Nodes/Nodes';
import {Operations} from '../../Operations';
import {PaginatedStorage} from '../../Storage/PaginatedStorage';
import {Tablets} from '../../Tablets/Tablets';
import {SchemaViewer} from '../Schema/SchemaViewer/SchemaViewer';
import {useCurrentSchema} from '../TenantContext';
import {isDatabaseEntityType} from '../utils/schema';

import {AccessRights} from './AccessRights/AccessRights';
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
import i18n from './i18n';

import './Diagnostics.scss';

interface DiagnosticsProps {
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

const b = cn('kv-tenant-diagnostics');

function Diagnostics(props: DiagnosticsProps) {
    const {path, database, type, subType, databaseFullPath} = useCurrentSchema();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dispatch = useTypedDispatch();
    const {diagnosticsTab = TENANT_DIAGNOSTICS_TABS_IDS.overview} = useTypedSelector(
        (state) => state.tenant,
    );

    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const {controlPlane, databaseType} = useTenantBaseInfo(
        isDatabaseEntityType(type) ? database : '',
    );

    const hasFeatureFlags = useFeatureFlagsAvailable();
    const hasTopicData = useTopicDataAvailable();
    const isViewerUser = useIsViewerUser();
    const pages = getPagesByType(type, subType, {
        hasFeatureFlags,
        hasTopicData,
        isTopLevel: path === database,
        hasBackups: typeof uiFactory.renderBackups === 'function' && Boolean(controlPlane),
        hasConfigs: isViewerUser,
        hasAccess: uiFactory.hasAccess,
        databaseType,
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

    // eslint-disable-next-line complexity
    const renderTabContent = () => {
        switch (activeTab?.id) {
            case TENANT_DIAGNOSTICS_TABS_IDS.overview: {
                return (
                    <DetailedOverview
                        type={type}
                        database={database}
                        path={path}
                        databaseFullPath={databaseFullPath}
                        additionalTenantProps={props.additionalTenantProps}
                        additionalNodesProps={props.additionalNodesProps}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.schema: {
                return (
                    <SchemaViewer
                        path={path}
                        database={database}
                        databaseFullPath={databaseFullPath}
                        type={type}
                        extended
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topQueries: {
                return <TopQueries database={database} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topShards: {
                return (
                    <TopShards
                        database={database}
                        path={path}
                        databaseFullPath={databaseFullPath}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.nodes: {
                return (
                    <Nodes
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        additionalNodesProps={props.additionalNodesProps}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.access: {
                return <AccessRights />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.tablets: {
                return (
                    <Tablets
                        scrollContainerRef={containerRef}
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.storage: {
                return <PaginatedStorage database={database} scrollContainerRef={containerRef} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.network: {
                return (
                    <NetworkWrapper
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        additionalNodesProps={props.additionalNodesProps}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.describe: {
                return (
                    <Describe path={path} databaseFullPath={databaseFullPath} database={database} />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.hotKeys: {
                return (
                    <HotKeys path={path} databaseFullPath={databaseFullPath} database={database} />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.graph: {
                return (
                    <Heatmap path={path} databaseFullPath={databaseFullPath} database={database} />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.consumers: {
                return (
                    <Consumers
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        type={type}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.partitions: {
                return (
                    <Partitions
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.topicData: {
                return (
                    <TopicData
                        key={path}
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        scrollContainerRef={containerRef}
                    />
                );
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.configs: {
                return <Configs database={database} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.operations: {
                return <Operations database={database} scrollContainerRef={containerRef} />;
            }
            case TENANT_DIAGNOSTICS_TABS_IDS.backups: {
                return uiFactory.renderBackups?.({
                    database,
                    scrollContainerRef: containerRef,
                });
            }
            default: {
                return <div>{i18n('no-data')}</div>;
            }
        }
    };
    const renderTabs = () => {
        return (
            <div className={b('header-wrapper')}>
                <div className={b('tabs')}>
                    <TabProvider value={activeTab?.id}>
                        <TabList size="l">
                            {pages.map(({id, title}) => {
                                const linkPath = getDiagnosticsPageLink(id);
                                return (
                                    <Tab key={id} value={id}>
                                        <InternalLink to={linkPath} as="tab">
                                            {title}
                                        </InternalLink>
                                    </Tab>
                                );
                            })}
                        </TabList>
                    </TabProvider>
                    <AutoRefreshControl />
                </div>
            </div>
        );
    };

    useScrollPosition(
        containerRef,
        `tenant-diagnostics-${database}-${activeTab?.id}`,
        activeTab?.id === TENANT_DIAGNOSTICS_TABS_IDS.overview,
    );

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
