import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
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
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {PaginatedStorage} from '../Storage/PaginatedStorage';
import {Tablets} from '../Tablets';

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

    // NodeId is always defined here because the page is wrapped with specific route Router
    const nodeId = match?.params.id as string;
    const activeTabIdFromQuery = match?.params.activeTab;

    const [{database: tenantNameFromQuery}] = useQueryParams(nodePageQueryParams);

    const activeTabId = nodePageTabSchema.parse(activeTabIdFromQuery);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {
        currentData: node,
        isLoading,
        error,
    } = nodeApi.useGetNodeInfoQuery({nodeId}, {pollingInterval: autoRefreshInterval});

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

    const renderHelmet = () => {
        const host = node?.Host ? node.Host : i18n('node');
        return (
            <Helmet
                titleTemplate={`%s — ${host} — YDB Monitoring`}
                defaultTitle={`${host} — YDB Monitoring`}
            >
                <title>{activeTab.title}</title>
            </Helmet>
        );
    };

    const renderPageMeta = () => {
        const hostItem = node?.Host ? `${i18n('fqdn')}: ${node.Host}` : undefined;
        const dcItem = node?.DC ? `${i18n('dc')}: ${node.DC}` : undefined;

        return (
            <PageMetaWithAutorefresh
                loading={pageLoading}
                items={[hostItem, dcItem]}
                className={b('meta')}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <EntityPageTitle
                entityName={i18n('node')}
                status={node?.SystemState}
                id={node?.NodeId}
                className={b('title')}
            />
        );
    };

    const renderInfo = () => {
        if (pageLoading) {
            return <InfoViewerSkeleton className={b('info')} rows={10} />;
        }

        return <FullNodeViewer node={node} className={b('info')} />;
    };

    const renderTabs = () => {
        return (
            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    items={nodeTabs}
                    activeTab={activeTab.id}
                    wrapTo={({id}, tabNode) => {
                        const path = getDefaultNodePath(
                            nodeId,
                            {database: tenantName},
                            id as NodeTab,
                        );
                        return (
                            <InternalLink to={path} key={id}>
                                {tabNode}
                            </InternalLink>
                        );
                    }}
                />
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab.id) {
            case 'storage': {
                return (
                    <PaginatedStorage
                        nodeId={nodeId}
                        parentRef={container}
                        viewContext={{
                            nodeId: nodeId?.toString(),
                        }}
                    />
                );
            }
            case 'tablets': {
                return <Tablets nodeId={nodeId} database={tenantName} />;
            }

            case 'structure': {
                return <NodeStructure nodeId={nodeId} />;
            }

            default:
                return false;
        }
    };

    const renderError = () => {
        if (!error) {
            return null;
        }

        return <ResponseError error={error} className={b('error')} />;
    };

    return (
        <div className={b(null)} ref={container}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderError()}
            {renderInfo()}
            {renderTabs()}
            {renderTabContent()}
        </div>
    );
}
