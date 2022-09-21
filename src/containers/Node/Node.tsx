import * as React from 'react';
import {useRouteMatch} from 'react-router';
import cn from 'bem-cn-lite';
import {useDispatch, useSelector} from 'react-redux';
import _ from 'lodash';

import {Tabs} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {TABLETS, STORAGE, NODE_PAGES, OVERVIEW, STRUCTURE} from './NodePages';
import Tablets from '../Tablets/Tablets';
import Storage from '../Storage/Storage';
import NodeOverview from './NodeOverview/NodeOverview';
import NodeStructure from './NodeStructure/NodeStructure';
import Loader from '../../components/Loader/Loader';
import {BasicNodeViewer} from '../../components/BasicNodeViewer';

import {getNodeInfo, resetNode} from '../../store/reducers/node';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {setHeader} from '../../store/reducers/header';
import {AutoFetcher} from '../../utils/autofetcher';

import './Node.scss';

const b = cn('node');

export const STORAGE_ROLE = 'Storage';

const headerNodes = {
    text: CLUSTER_PAGES.nodes.title,
    link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.nodes.id}),
};

const autofetcher = new AutoFetcher();

interface NodeProps {
    additionalNodesInfo?: any;
    className?: string;
}

function Node(props: NodeProps) {
    const dispatch = useDispatch();

    const wasLoaded = useSelector((state: any) => state.node.wasLoaded);
    const loading = useSelector((state: any) => state.node.loading);
    const error = useSelector((state: any) => state.node.error);

    const node = useSelector((state: any) => state.node?.data?.SystemStateInfo?.[0]);

    const nodeHost = node?.Host;

    const match =
        useRouteMatch<{id: string; activeTab: string}>(routes.node) ?? Object.create(null);

    const {id: nodeId, activeTab} = match.params;

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
        const fetchData = () => dispatch(getNodeInfo(nodeId));
        fetchData();
        autofetcher.start();
        autofetcher.fetch(() => fetchData());
        dispatch(setHeader([headerNodes]));
        return () => {
            autofetcher.stop();
            dispatch(resetNode());
        };
    }, [nodeId]);

    React.useEffect(() => {
        dispatch(
            setHeader([
                headerNodes,
                {
                    text: nodeHost,
                },
            ]),
        );
    }, [nodeHost]);

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
                return (
                    <NodeOverview
                        node={node}
                        className={b('overview-wrapper')}
                    />
                );
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
        return <Loader />;
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
