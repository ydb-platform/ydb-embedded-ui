import React, {useEffect, useMemo} from 'react';

import type {TBlock, TGraphConfig} from '@gravity-ui/graph';
import {Graph, GraphState, CanvasBlock} from '@gravity-ui/graph';
import {
    GraphBlock,
    GraphCanvas,
    MultipointConnection,
    TConnection,
    useGraph,
    useGraphEvent,
} from '@gravity-ui/graph/react';
import type {Data, GraphNode, Options, Shapes} from '@gravity-ui/paranoid';

import {prepareBlocks, prepareConnections, parseCustomPropertyValue} from './utils';

import {cn} from '../../utils/cn';

import './GravityGraph.scss';

const b = cn('ydb-gravity-graph');

import {QueryBlockComponent} from './BlockComponents/QueryBlockComponent';
import {ResultBlockComponent} from './BlockComponents/ResultBlockComponent';
import {StageBlockComponent} from './BlockComponents/StageBlockComponent';
import {ConnectionBlockComponent} from './BlockComponents/ConnectionBlockComponent';
import {graphColorsConfig} from './colorsConfig';
import {GraphControls} from './GraphControls';
import {calculateTreeLayout, calculateConnectionPaths} from './treeLayout';

interface Props<T> {
    data: Data<T>;
    theme?: string;
}

const config: TGraphConfig = {
    settings: {
        connection: MultipointConnection,
        // blockComponents: {
        //     query: QueryBlockView,
        // },
        // canDragCamera: true,
        // canZoomCamera: false,
        // useBezierConnections: false,
        showConnectionArrows: false,
    },
};

const renderBlockFn = (graph, block) => {
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
                <>
                    <Component
                        graph={graph}
                        block={block}
                        className={b('block-content', block.is)}
                    />
                    {block.id !== 'undefined' && block.is !== 'result' && (
                        <div className={b('block-id')}>#{block.id}</div>
                    )}
                </>
            ) : (
                block.id
            )}
        </GraphBlock>
    );
};

export function GravityGraph<T>({data, theme}: Props<T>) {
    const {graph, start} = useGraph(config);

    React.useEffect(() => {
        const blocks = prepareBlocks(data.nodes);
        const connections = prepareConnections(data.links);
        const layouted = calculateTreeLayout(blocks, connections);
        const edges = calculateConnectionPaths(layouted, connections);

        graph.setEntities({
            blocks: layouted,
            connections: edges,
        });
    }, [data.nodes, data.links, graph]);

    React.useEffect(() => {
        graph.setColors(parseCustomPropertyValue(graphColorsConfig, graph.getGraphCanvas()));
    }, [graph, theme]);

    useGraphEvent(graph, 'state-change', ({state}) => {
        if (state === GraphState.ATTACHED) {
            graph.cameraService.set({
                scale: 1,
                scaleMax: 1.5,
                scaleMin: 0.5,
            });
            graph.setConstants({
                block: {
                    SCALES: [0.125, 0.225, 0.5], // Detailed view stays until zoom = 0.5
                },
            });
            start();
            // graph.zoomTo("center", { padding: 300 });
        }
    });

    return (
        <>
            <GraphCanvas graph={graph} renderBlock={renderBlockFn} />
            <GraphControls graph={graph} />
        </>
    );
}
