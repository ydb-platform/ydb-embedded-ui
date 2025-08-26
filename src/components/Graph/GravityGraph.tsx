import React, {useEffect, useMemo} from 'react';

import type {TBlock, TGraphConfig} from '@gravity-ui/graph';
import {Graph, GraphState, CanvasBlock} from '@gravity-ui/graph';
import {
    GraphBlock,
    GraphCanvas,
    MultipointConnection,
    TConnection,
    useElk,
    useGraph,
    useGraphEvent,
} from '@gravity-ui/graph/react';
import type {Data, GraphNode, Options, Shapes} from '@gravity-ui/paranoid';
import type {ElkExtendedEdge, ElkNode} from 'elkjs';
import ELK from 'elkjs';

import {
    prepareBlocks,
    prepareChildren,
    prepareConnections,
    prepareEdges,
    parseCustomPropertyValue,
} from './utils';

import {cn} from '../../utils/cn';

import './GravityGraph.scss';

const b = cn('ydb-gravity-graph');

import {QueryBlockView} from './BlockComponents/QueryBlockView';
import {QueryBlockComponent} from './BlockComponents/QueryBlockComponent';
import {ResultBlockComponent} from './BlockComponents/ResultBlockComponent';
import {StageBlockComponent} from './BlockComponents/StageBlockComponent';
import {ConnectionBlockComponent} from './BlockComponents/ConnectionBlockComponent';
import {graphColorsConfig} from './colorsConfig';

interface Props<T> {
    data: Data<T>;
    theme?: string;
}

const config = {
    settings: {
        connection: MultipointConnection,
        blockComponents: {
            query: QueryBlockView,
        },
        // canDragCamera: true,
        // canZoomCamera: false,
        // useBezierConnections: false,
        showConnectionArrows: false,
    },
};
const elk = new ELK();

const renderBlockFn = (graph, block) => {
    console.log('===', block);

    const map = {
        query: QueryBlockComponent,
        result: ResultBlockComponent,
        stage: StageBlockComponent,
        connection: ConnectionBlockComponent,
    };

    const Component = map[block.is];

    return (
        <GraphBlock graph={graph} block={block} className={b('block')}>
            {Component ? (
                <Component graph={graph} block={block} className={b('block-content', block.is)} />
            ) : (
                block.id
            )}
        </GraphBlock>
    );
};

// const _blocks: TBlock[] = [
//     {
//         width: 200,
//         height: 160,
//         id: 'Left',
//         is: 'block-action',
//         selected: false,
//         name: 'Left block',
//         anchors: [],
//     },
//     {
//         width: 200,
//         height: 160,
//         id: 'Right',
//         is: 'block-action',
//         selected: false,
//         name: 'Right block',
//         anchors: [],
//     },
// ];

// const _connections = [
//     {
//         id: 'c1',
//         sourceBlockId: 'Left',
//         targetBlockId: 'Right',
//     },
// ];

const baseElkConfig = {
    id: 'root',
    layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        // 'elk.spacing.edgeNode': '50',
        'elk.layered.spacing.nodeNodeBetweenLayers': '20',
        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
        'elk.layered.nodePlacement.bk.ordering': 'INTERACTIVE',
        'elk.debugMode': true,
        // 'elk.alignment': 'CENTER'
    },
};

export function GravityGraph<T>({data, theme}: Props<T>) {
    // console.log('997', data);

    const _blocks = useMemo(() => prepareBlocks(data.nodes), [data.nodes]);
    const _connections = useMemo(() => prepareConnections(data.links), [data.links]);
    const elkConfig = useMemo(
        () => ({
            ...baseElkConfig,
            children: prepareChildren(_blocks),
            edges: prepareEdges(_connections),
        }),
        [_blocks, _connections],
    );
    const {graph, start} = useGraph(config);
    const {isLoading, result} = useElk(elkConfig, elk);

    React.useEffect(() => {
        if (isLoading || !result) {
            return;
        }

        // console.log('result', result);

        const blocks = _blocks.map((block) => {
            return {
                ...block,
                ...result.blocks[block.id],
            };
        });

        const connections = _connections.reduce((acc, connection) => {
            if (connection.id in result.edges) {
                acc.push({
                    ...connection,
                    ...result.edges[connection.id],
                });
            }
            return acc;
        }, []);

        // console.log('connections', connections);

        graph.setEntities({
            blocks,
            connections,
        });
    }, [isLoading, result, graph]);

    React.useEffect(() => {
        graph.setColors(parseCustomPropertyValue(graphColorsConfig, graph.getGraphCanvas()));
    }, [graph, theme]);

    useGraphEvent(graph, 'state-change', ({state}) => {
        if (state === GraphState.ATTACHED) {
            console.log('start');
            graph.cameraService.set({
                scale: 1,
                scaleMax: 1.5,
            });
            start();
            // graph.zoomTo("center", { padding: 300 });
        }
    });

    return <GraphCanvas graph={graph} renderBlock={renderBlockFn} />;
}
