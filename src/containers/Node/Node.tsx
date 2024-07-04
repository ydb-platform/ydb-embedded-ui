import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {useLocation, useRouteMatch} from 'react-router';
import {Link} from 'react-router-dom';

import {BasicNodeViewer} from '../../components/BasicNodeViewer';
import {ResponseError} from '../../components/Errors/ResponseError';
import {FullNodeViewer} from '../../components/FullNodeViewer/FullNodeViewer';
import {Loader} from '../../components/Loader';
import routes, {createHref, parseQuery} from '../../routes';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {nodeApi} from '../../store/reducers/node/node';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {DEFAULT_POLLING_INTERVAL} from '../../utils/constants';
import {useTypedDispatch} from '../../utils/hooks';
import {StorageWrapper} from '../Storage/StorageWrapper';
import {Tablets} from '../Tablets';

import {NODE_PAGES, OVERVIEW, STORAGE, STRUCTURE, TABLETS} from './NodePages';
import NodeStructure from './NodeStructure/NodeStructure';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

interface NodeProps {
    additionalNodesProps?: AdditionalNodesProps;
    className?: string;
}

export function Node(props: NodeProps) {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();
    const location = useLocation();

    const match =
        useRouteMatch<{id: string; activeTab: string}>(routes.node) ?? Object.create(null);

    const {id: nodeId, activeTab} = match.params;
    const {tenantName: tenantNameFromQuery} = parseQuery(location);

    const {currentData, isFetching, error} = nodeApi.useGetNodeInfoQuery(
        {nodeId},
        {pollingInterval: DEFAULT_POLLING_INTERVAL},
    );
    const loading = isFetching && currentData === undefined;
    const node = currentData;

    const {activeTabVerified, nodeTabs} = React.useMemo(() => {
        const hasStorage = node?.Roles?.find((el) => el === STORAGE_ROLE);

        const nodePages = hasStorage ? NODE_PAGES : NODE_PAGES.filter((el) => el.id !== STORAGE);

        const actualNodeTabs = nodePages.map((page) => {
            return {
                ...page,
                title: page.name,
            };
        });

        let actualActiveTab = actualNodeTabs.find(({id}) => id === activeTab);
        if (!actualActiveTab) {
            actualActiveTab = actualNodeTabs[0];
        }

        return {activeTabVerified: actualActiveTab, nodeTabs: actualNodeTabs};
    }, [activeTab, node]);

    React.useEffect(() => {
        const tenantName = node?.Tenants?.[0] || tenantNameFromQuery?.toString();

        dispatch(
            setHeaderBreadcrumbs('node', {
                tenantName,
                nodeId,
            }),
        );
    }, [dispatch, node, nodeId, tenantNameFromQuery]);

    const renderTabs = () => {
        return (
            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    items={nodeTabs}
                    activeTab={activeTabVerified.id}
                    wrapTo={({id}, tabNode) => (
                        <Link
                            to={createHref(routes.node, {id: nodeId, activeTab: id})}
                            key={id}
                            className={b('tab')}
                        >
                            {tabNode}
                        </Link>
                    )}
                    allowNotSelected={true}
                />
            </div>
        );
    };
    const renderTabContent = () => {
        switch (activeTabVerified.id) {
            case STORAGE: {
                return (
                    <div className={b('storage')}>
                        <StorageWrapper nodeId={nodeId} parentContainer={container.current} />
                    </div>
                );
            }
            case TABLETS: {
                return <Tablets nodeId={nodeId} className={b('node-page-wrapper')} />;
            }

            case OVERVIEW: {
                return <FullNodeViewer node={node} className={b('overview-wrapper')} />;
            }

            case STRUCTURE: {
                return <NodeStructure className={b('node-page-wrapper')} nodeId={nodeId} />;
            }
            default:
                return false;
        }
    };

    if (loading) {
        return <Loader size="l" />;
    } else if (error) {
        return <ResponseError error={error} />;
    } else {
        if (node) {
            return (
                <div className={b(null, props.className)} ref={container}>
                    <Helmet
                        titleTemplate={`%s — ${node.Host} — YDB Monitoring`}
                        defaultTitle={`${node.Host} — YDB Monitoring`}
                    >
                        <title>{activeTabVerified.title}</title>
                    </Helmet>

                    <BasicNodeViewer
                        node={node}
                        additionalNodesProps={props.additionalNodesProps}
                        className={b('header')}
                    />

                    {renderTabs()}

                    <div className={b('content')}>{renderTabContent()}</div>
                </div>
            );
        }
        return <div className="error">no node data</div>;
    }
}
