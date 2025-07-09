import React from 'react';

import {Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useRouteMatch} from 'react-router-dom';
import {useQueryParams} from 'use-query-params';

import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {FullNodeViewer} from '../../components/FullNodeViewer/FullNodeViewer';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import routes from '../../routes';
import {
    useCapabilitiesLoaded,
    useDiskPagesAvailable,
} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {nodeApi} from '../../store/reducers/node/node';
import type {PreparedNode} from '../../store/reducers/node/types';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {PaginatedStorage} from '../Storage/PaginatedStorage';
import {Tablets} from '../Tablets/Tablets';

import type {NodeTab} from './NodePages';
import {NODE_TABS, getDefaultNodePath, nodePageQueryParams, nodePageTabSchema} from './NodePages';
import NodeStructure from './NodeStructure/NodeStructure';
import i18n from './i18n';

import './Node.scss';

const b = cn('node');

const STORAGE_ROLE = 'Storage';

export function Node() {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();

    const match = useRouteMatch<{id: string; activeTab: string}>(routes.node);

    const nodeId = match?.params.id;
    const activeTabIdFromQuery = match?.params.activeTab;

    const [{database: tenantNameFromQuery}] = useQueryParams(nodePageQueryParams);

    const activeTabId = nodePageTabSchema.parse(activeTabIdFromQuery);

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const params = nodeId ? {nodeId} : skipToken;
    const {
        currentData: node,
        isLoading,
        error,
    } = nodeApi.useGetNodeInfoQuery(params, {pollingInterval: autoRefreshInterval});

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const isDiskPagesAvailable = useDiskPagesAvailable();

    const pageLoading = isLoading || !capabilitiesLoaded;

    const isStorageNode = node?.Roles?.find((el) => el === STORAGE_ROLE);

    const {activeTab, nodeTabs} = React.useMemo(() => {
        let actulaNodeTabs = isStorageNode
            ? NODE_TABS
            : NODE_TABS.filter((el) => el.id !== 'storage');
        if (isDiskPagesAvailable) {
            actulaNodeTabs = actulaNodeTabs.filter((el) => el.id !== 'structure');
        }

        const actualActiveTab =
            actulaNodeTabs.find(({id}) => id === activeTabId) ?? actulaNodeTabs[0];

        return {activeTab: actualActiveTab, nodeTabs: actulaNodeTabs};
    }, [isStorageNode, isDiskPagesAvailable, activeTabId]);

    const tenantName = node?.Tenants?.[0] || tenantNameFromQuery?.toString();

    React.useEffect(() => {
        // Dispatch only if loaded to get correct node role
        if (!isLoading) {
            dispatch(
                setHeaderBreadcrumbs('node', {
                    tenantName,
                    nodeRole: isStorageNode ? 'Storage' : 'Compute',
                    nodeId,
                }),
            );
        }
    }, [dispatch, tenantName, nodeId, isLoading, isStorageNode]);

    return (
        <div className={b(null)} ref={container}>
            {<NodePageHelmet node={node} activeTabTitle={activeTab.title} />}
            {<NodePageMeta node={node} loading={pageLoading} />}
            {<NodePageTitle node={node} />}
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            {<NodePageInfo node={node} loading={pageLoading} />}
            {nodeId ? (
                <NodePageContent
                    nodeId={nodeId}
                    tenantName={tenantName}
                    activeTabId={activeTab.id}
                    tabs={nodeTabs}
                    parentContainer={container}
                />
            ) : null}
        </div>
    );
}

interface NodePageHelmetProps {
    node?: PreparedNode;
    activeTabTitle?: string;
}

function NodePageHelmet({node, activeTabTitle}: NodePageHelmetProps) {
    const host = node?.Host ? node.Host : i18n('node');
    return (
        <Helmet
            titleTemplate={`%s — ${host} — YDB Monitoring`}
            defaultTitle={`${host} — YDB Monitoring`}
        >
            <title>{activeTabTitle}</title>
        </Helmet>
    );
}

interface NodePageMetaProps {
    node?: PreparedNode;
    loading?: boolean;
}

function NodePageMeta({node, loading}: NodePageMetaProps) {
    const hostItem = node?.Host ? `${i18n('fqdn')}: ${node.Host}` : undefined;
    const dcItem = node?.DC ? `${i18n('dc')}: ${node.DC}` : undefined;

    return (
        <PageMetaWithAutorefresh
            loading={loading}
            items={[hostItem, dcItem]}
            className={b('meta')}
        />
    );
}

interface NodePageTitleProps {
    node?: PreparedNode;
}

function NodePageTitle({node}: NodePageTitleProps) {
    return (
        <EntityPageTitle
            entityName={i18n('node')}
            status={node?.SystemState}
            id={node?.NodeId}
            className={b('title')}
        />
    );
}

interface NodePageInfoProps {
    node?: PreparedNode;
    loading?: boolean;
}

function NodePageInfo({node, loading}: NodePageInfoProps) {
    if (loading) {
        return <InfoViewerSkeleton className={b('info')} rows={10} />;
    }

    return <FullNodeViewer node={node} className={b('info')} />;
}

interface NodePageContentProps {
    nodeId: string;
    tenantName?: string;

    activeTabId: NodeTab;
    tabs: {id: string; title: string}[];

    parentContainer: React.RefObject<HTMLDivElement>;
}

function NodePageContent({
    nodeId,
    tenantName,
    activeTabId,
    tabs,
    parentContainer,
}: NodePageContentProps) {
    const renderTabs = () => {
        return (
            <div className={b('tabs')}>
                <TabProvider value={activeTabId}>
                    <TabList className={b('tab-list')} size="l">
                        {tabs.map(({id, title}) => {
                            const path = getDefaultNodePath(
                                nodeId,
                                {database: tenantName},
                                id as NodeTab,
                            );
                            return (
                                <Tab value={id} key={id}>
                                    <InternalLink to={path} as="tab">
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTabId) {
            case 'storage': {
                return (
                    <PaginatedStorage
                        nodeId={nodeId}
                        scrollContainerRef={parentContainer}
                        viewContext={{
                            nodeId: nodeId,
                        }}
                    />
                );
            }
            case 'tablets': {
                return (
                    <Tablets
                        scrollContainerRef={parentContainer}
                        nodeId={nodeId}
                        database={tenantName}
                        onlyActive
                    />
                );
            }

            case 'structure': {
                return <NodeStructure nodeId={nodeId} />;
            }

            default:
                return false;
        }
    };

    return (
        <React.Fragment>
            {renderTabs()}
            {renderTabContent()}
        </React.Fragment>
    );
}
