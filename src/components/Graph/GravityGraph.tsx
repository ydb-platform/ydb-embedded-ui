import React from 'react';

import {GraphState} from '@gravity-ui/graph';
import type {HookGraphParams} from '@gravity-ui/graph/react';
import {GraphBlock, GraphCanvas, useGraph, useGraphEvent} from '@gravity-ui/graph/react';
// @ts-ignore - workerize-loader syntax
import createWorker from 'workerize-loader!./treeLayout.worker';

import {cn} from '../../utils/cn';

const b = cn('ydb-gravity-graph');

import {ConnectionBlockComponent} from './BlockComponents/ConnectionBlockComponent';
import {QueryBlockComponent} from './BlockComponents/QueryBlockComponent';
import {ResultBlockComponent} from './BlockComponents/ResultBlockComponent';
import {StageBlockComponent} from './BlockComponents/StageBlockComponent';
import {GraphControls} from './GraphControls';
import {NonSelectableConnection} from './NonSelectableConnection';
import {graphColorsConfig} from './colorsConfig';
import type {Data} from './types';
import {parseCustomPropertyValue} from './utils';

import './GravityGraph.scss';

interface Props<T> {
    data: Data<T>;
    theme?: string;
}

const config: HookGraphParams = {
    settings: {
        connection: NonSelectableConnection,
        showConnectionArrows: false,
    },
};

const renderBlockFn = (graph: any, block: any) => {
    const map: Record<string, React.ComponentType<any>> = {
        query: QueryBlockComponent,
        result: ResultBlockComponent,
        stage: StageBlockComponent,
        connection: ConnectionBlockComponent,
    };

    const Component = map[block.is as keyof typeof map];

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
        // Using workerize-loader to inline the worker and avoid CORS issues
        const worker = createWorker();

        // Call the exported function from the worker
        worker
            .calculateLayout(data.nodes, data.links)
            .then((result: {layout: any; edges: any}) => {
                graph.setEntities({
                    blocks: result.layout,
                    connections: result.edges,
                });
            })
            .catch((err: Error) => {
                console.error('Worker error:', err);
            });

        return () => {
            worker.terminate();
        };
    }, [data.nodes, data.links, graph]);

    React.useEffect(() => {
        graph.setColors(parseCustomPropertyValue(graphColorsConfig));
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
