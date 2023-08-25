import * as React from 'react';
import {useLocation, useRouteMatch} from 'react-router';
import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';
import _ from 'lodash';

import {Tabs} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {TABLETS, STORAGE, NODE_PAGES, OVERVIEW, STRUCTURE} from './NodePages';
import {Tablets} from '../Tablets';
import {Storage} from '../Storage/Storage';
import NodeStructure from './NodeStructure/NodeStructure';
import {Loader} from '../../components/Loader';
import {BasicNodeViewer} from '../../components/BasicNodeViewer';
import {FullNodeViewer} from '../../components/FullNodeViewer/FullNodeViewer';

import {getNodeInfo, resetNode} from '../../store/reducers/node/node';
import routes, {createHref, parseQuery} from '../../routes';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {AutoFetcher} from '../../utils/autofetcher';
import {useTypedSelector} from '../../utils/hooks';

import type {AdditionalNodesInfo} from '../../utils/nodes';

import {clusterTabsIds} from '../Cluster/utils';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

const autofetcher = new AutoFetcher();

interface NodeProps {
    additionalNodesInfo?: AdditionalNodesInfo;
    className?: string;
}

function Node(props: NodeProps) {
    const dispatch = useDispatch();
    const location = useLocation();

    const {loading, wasLoaded, error, data} = useTypedSelector((state) => state.node);
    const node = data?.SystemStateInfo?.[0];

    const match =
        useRouteMatch<{id: string; activeTab: string}>(routes.node) ?? Object.create(null);

    const {id: nodeId, activeTab} = match.params;
    const {tenantName: tenantNameFromQuery} = parseQuery(location);

    const {activeTabVerified, nodeTabs} = React.useMemo(() => {
        const hasStorage = _.find(node?.Roles as any[], (el) => el === STORAGE_ROLE);
        let activeTabVerified = activeTab;
        if (!hasStorage && activeTab === STORAGE) {
            activeTabVerified = OVERVIEW;
        }
        const nodePages = hasStorage ? NODE_PAGES : NODE_PAGES.filter((el) => el.id !== STORAGE);

        const nodeTabs = nodePages.map((page) => {
            return {
                ...page,
                title: page.name,
            };
        });

        return {activeTabVerified, nodeTabs};
    }, [activeTab, node]);

    React.useEffect(() => {
        const tenantName = node?.Tenants?.[0] || tenantNameFromQuery?.toString();

        dispatch(
            setHeaderBreadcrumbs('node', {
                clusterTab: clusterTabsIds.nodes,
                tenantName,
                nodeId,
            }),
        );
    }, [dispatch, node, nodeId, tenantNameFromQuery]);

    React.useEffect(() => {
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
                    activeTab={activeTabVerified}
                    wrapTo={({id}, node) => (
                        <Link
                            to={createHref(routes.node, {id: nodeId, activeTab: id})}
                            key={id}
                            className={b('tab')}
                        >
                            {node}
                        </Link>
                    )}
                    allowNotSelected={true}
                />
            </div>
        );
    };
    const renderTabContent = () => {
        const {additionalNodesInfo} = props;

        switch (activeTab) {
            case STORAGE: {
                return (
                    <div className={b('storage')}>
                        <Storage nodeId={nodeId} />
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
                return (
                    <NodeStructure
                        className={b('node-page-wrapper')}
                        nodeId={nodeId}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                );
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
                <div className={b(null, props.className)}>
                    <BasicNodeViewer
                        node={node}
                        additionalNodesInfo={props.additionalNodesInfo}
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
