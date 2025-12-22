import React from 'react';

import {Checkbox, Loader} from '@gravity-ui/uikit';
import {Link} from 'react-router-dom';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ProblemFilter} from '../../../../components/ProblemFilter/ProblemFilter';
import {getDefaultNodePath} from '../../../../routes';
import {networkApi} from '../../../../store/reducers/network/network';
import type {TNetNodeInfo} from '../../../../types/api/netInfo';
import {cn} from '../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {useWithProblemsQueryParam} from '../../../../utils/hooks/useWithProblemsQueryParam';

import {NetworkPlaceholder} from './NetworkPlaceholder/NetworkPlaceholder';
import {NodeTooltipPopup} from './NodeTooltipPopup/NodeTooltipPopup';
import {Nodes} from './Nodes/Nodes';
import i18n from './i18n';
import {groupNodesByField} from './utils';

import './Network.scss';

const b = cn('network');

interface NetworkProps {
    database: string;
    databaseFullPath: string;
}

export function Network({database, databaseFullPath}: NetworkProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {withProblems, handleWithProblemsChange} = useWithProblemsQueryParam();

    const [clickedNode, setClickedNode] = React.useState<TNetNodeInfo>();
    const [showId, setShowId] = React.useState(false);
    const [showRacks, setShowRacks] = React.useState(false);

    const [nodeTooltip, setNodeTooltip] = React.useState<{
        anchor: HTMLDivElement | null;
        data: {
            nodeId: number | string;
            connected?: number;
            capacity?: number;
            rack: string;
        } | null;
    }>({
        anchor: null,
        data: null,
    });

    const {currentData, isFetching, error} = networkApi.useGetNetworkInfoQuery(
        {database, databaseFullPath},
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const loading = isFetching && currentData === undefined;

    const netWorkInfo = currentData;
    const nodes = React.useMemo(
        () => (netWorkInfo?.Tenants && netWorkInfo.Tenants[0].Nodes) ?? [],
        [netWorkInfo],
    );

    const handleShowNodeTooltip = React.useCallback(
        (
            anchor: HTMLDivElement,
            data: {
                nodeId: number | string;
                connected?: number;
                capacity?: number;
                rack: string;
            },
        ) => {
            setNodeTooltip({anchor, data});
        },
        [],
    );

    const handleHideNodeTooltip = React.useCallback(() => {
        setNodeTooltip({anchor: null, data: null});
    }, []);

    const nodesGroupedByType = React.useMemo(() => groupNodesByField(nodes, 'NodeType'), [nodes]);
    const rightNodes = React.useMemo(
        () => (clickedNode ? groupNodesByField(clickedNode.Peers ?? [], 'NodeType') : {}),
        [clickedNode],
    );

    if (loading) {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    if (!error && nodes.length === 0) {
        return <div className="error">{i18n('description_no-nodes-data')}</div>;
    }

    return (
        <div className={b()}>
            <NodeTooltipPopup nodeTooltip={nodeTooltip} onClose={handleHideNodeTooltip} />
            {error ? <ResponseError error={error} /> : null}
            {nodes.length > 0 ? (
                <div className={b('inner')}>
                    <div className={b('nodes-row')}>
                        <div className={b('left')}>
                            <div className={b('controls-wrapper')}>
                                <div className={b('controls')}>
                                    <ProblemFilter
                                        value={withProblems}
                                        onChange={handleWithProblemsChange}
                                        className={b('problem-filter')}
                                    />
                                    <div className={b('checkbox-wrapper')}>
                                        <Checkbox
                                            onUpdate={() => {
                                                setShowId(!showId);
                                            }}
                                            checked={showId}
                                        >
                                            {i18n('field_id')}
                                        </Checkbox>
                                    </div>
                                    <div className={b('checkbox-wrapper')}>
                                        <Checkbox
                                            onUpdate={() => {
                                                setShowRacks(!showRacks);
                                            }}
                                            checked={showRacks}
                                        >
                                            {i18n('label_racks')}
                                        </Checkbox>
                                    </div>
                                </div>
                            </div>
                            <Nodes
                                nodes={nodesGroupedByType}
                                showId={showId}
                                showRacks={showRacks}
                                clickedNode={clickedNode}
                                onClickNode={setClickedNode}
                                onShowNodeTooltip={handleShowNodeTooltip}
                                onHideNodeTooltip={handleHideNodeTooltip}
                            />
                        </div>

                        <div className={b('right')}>
                            {clickedNode ? (
                                <div>
                                    <div className={b('label')}>
                                        {i18n('label_connectivity')}{' '}
                                        <Link
                                            className={b('link')}
                                            to={getDefaultNodePath({id: clickedNode.NodeId})}
                                        >
                                            {clickedNode.NodeId}
                                        </Link>{' '}
                                        {i18n('label_to-other-nodes')}
                                    </div>
                                    <div className={b('nodes-row')}>
                                        <Nodes
                                            nodes={rightNodes}
                                            isRight
                                            showId={showId}
                                            showRacks={showRacks}
                                            clickedNode={clickedNode}
                                            onClickNode={setClickedNode}
                                            onShowNodeTooltip={handleShowNodeTooltip}
                                            onHideNodeTooltip={handleHideNodeTooltip}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <NetworkPlaceholder />
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
