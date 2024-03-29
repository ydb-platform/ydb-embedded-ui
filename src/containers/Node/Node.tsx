import {useEffect, useMemo, useRef} from 'react';
import {useLocation, useRouteMatch} from 'react-router';
import cn from 'bem-cn-lite';
import {Helmet} from 'react-helmet-async';

import {Tabs} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {TABLETS, STORAGE, NODE_PAGES, OVERVIEW, STRUCTURE} from './NodePages';
import {Tablets} from '../Tablets';
import {StorageWrapper} from '../Storage/StorageWrapper';
import NodeStructure from './NodeStructure/NodeStructure';
import {Loader} from '../../components/Loader';
import {BasicNodeViewer} from '../../components/BasicNodeViewer';
import {FullNodeViewer} from '../../components/FullNodeViewer/FullNodeViewer';

import {getNodeInfo, resetNode} from '../../store/reducers/node/node';
import routes, {createHref, parseQuery} from '../../routes';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {AutoFetcher} from '../../utils/autofetcher';
import {useTypedSelector, useTypedDispatch} from '../../utils/hooks';

import type {AdditionalNodesProps} from '../../types/additionalProps';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

const autofetcher = new AutoFetcher();

interface NodeProps {
    additionalNodesProps?: AdditionalNodesProps;
    className?: string;
}

function Node(props: NodeProps) {
    const container = useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();
    const location = useLocation();

    const {loading, wasLoaded, error, data: node} = useTypedSelector((state) => state.node);

    const match =
        useRouteMatch<{id: string; activeTab: string}>(routes.node) ?? Object.create(null);

    const {id: nodeId, activeTab} = match.params;
    const {tenantName: tenantNameFromQuery} = parseQuery(location);

    const {activeTabVerified, nodeTabs} = useMemo(() => {
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

    useEffect(() => {
        const tenantName = node?.Tenants?.[0] || tenantNameFromQuery?.toString();

        dispatch(
            setHeaderBreadcrumbs('node', {
                tenantName,
                nodeId,
            }),
        );
    }, [dispatch, node, nodeId, tenantNameFromQuery]);

    useEffect(() => {
        const fetchData = () => dispatch(getNodeInfo(nodeId));
        fetchData();
        autofetcher.start();
        autofetcher.fetch(() => fetchData());

        return () => {
            autofetcher.stop();
            dispatch(resetNode());
        };
    }, [dispatch, nodeId]);

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

    if (loading && !wasLoaded) {
        return <Loader size="l" />;
    } else if (error) {
        return <div>{error.statusText}</div>;
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

export default Node;
