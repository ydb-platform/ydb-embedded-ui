import React from 'react';

import {GraphState} from '@gravity-ui/graph';
import type {TBlockId} from '@gravity-ui/graph';
import type {HookGraphParams} from '@gravity-ui/graph/react';
import {GraphBlock, GraphCanvas, useGraph, useGraphEvent} from '@gravity-ui/graph/react';

import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';

const b = cn('ydb-gravity-graph');
const GRAPH_FIT_PADDING = 40;

import {ConnectionBlockComponent} from './BlockComponents/ConnectionBlockComponent';
import {QueryBlockComponent} from './BlockComponents/QueryBlockComponent';
import {ResultBlockComponent} from './BlockComponents/ResultBlockComponent';
import {StageBlockComponent} from './BlockComponents/StageBlockComponent';
import {FullViewportBackground} from './FullViewportBackground';
import {GraphControls} from './GraphControls';
import {NonSelectableConnection} from './NonSelectableConnection';
import {graphColorsConfig} from './colorsConfig';
import {runTreeLayout} from './runTreeLayout';
import type {Data} from './types';
import {parseCustomPropertyValue} from './utils';

import './GravityGraph.scss';

interface Props<T> {
    data: Data<T>;
    onError: (error: Error) => void;
    theme?: string;
}

const config: HookGraphParams = {
    settings: {
        background: FullViewportBackground,
        connection: NonSelectableConnection,
        showConnectionArrows: false,
    },
};

const createGraphLayoutWorker = () => {
    if (uiFactory.createGraphLayoutWorker) {
        return uiFactory.createGraphLayoutWorker();
    }

    return new Worker(new URL('../../graphLayout.worker', import.meta.url));
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
                <React.Fragment>
                    <Component
                        graph={graph}
                        block={block}
                        className={b('block-content', block.is)}
                    />
                    {block.planNodeId !== undefined && block.is !== 'result' && (
                        <div className={b('block-id')}>#{block.planNodeId}</div>
                    )}
                </React.Fragment>
            ) : (
                block.id
            )}
        </GraphBlock>
    );
};

export function GravityGraph<T>({data, onError, theme}: Props<T>) {
    const {graph, start} = useGraph(config);
    const cameraSizeRef = React.useRef({width: 0, height: 0});
    const graphBlockIdsRef = React.useRef<TBlockId[]>([]);
    const fitFrameRef = React.useRef<number>();
    const fitGraphToViewport = React.useCallback(() => {
        const {width, height} = graph.cameraService.getCameraState();

        if (
            graph.state !== GraphState.READY ||
            width <= 0 ||
            height <= 0 ||
            graphBlockIdsRef.current.length === 0
        ) {
            return;
        }

        graph.zoomTo(graphBlockIdsRef.current, {padding: GRAPH_FIT_PADDING});
    }, [graph]);
    const scheduleGraphFit = React.useCallback(() => {
        if (fitFrameRef.current !== undefined) {
            globalThis.cancelAnimationFrame(fitFrameRef.current);
        }

        // camera-change is emitted before its new size is committed.
        fitFrameRef.current = globalThis.requestAnimationFrame(() => {
            fitFrameRef.current = undefined;
            fitGraphToViewport();
        });
    }, [fitGraphToViewport]);

    React.useEffect(() => {
        return () => {
            if (fitFrameRef.current !== undefined) {
                globalThis.cancelAnimationFrame(fitFrameRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        return runTreeLayout({
            request: {
                nodes: data.nodes,
                links: data.links,
            },
            createWorker: createGraphLayoutWorker,
            onResult: ({layout, edges}) => {
                graphBlockIdsRef.current = layout.map(({id}) => id);
                graph.setEntities({
                    blocks: layout,
                    connections: edges,
                });
                scheduleGraphFit();
            },
            onError,
        });
    }, [data.nodes, data.links, graph, onError, scheduleGraphFit]);

    React.useEffect(() => {
        graph.setColors(parseCustomPropertyValue(graphColorsConfig));
    }, [graph, theme]);

    useGraphEvent(graph, 'state-change', ({state}) => {
        if (state === GraphState.ATTACHED) {
            graph.cameraService.set({
                scale: 1,
                scaleMax: 1.5,
            });
            graph.setConstants({
                block: {
                    SCALES: [0.125, 0.225, 0.5], // Detailed view stays until zoom = 0.5
                },
            });
            start();
        } else if (state === GraphState.READY) {
            scheduleGraphFit();
        }
    });

    useGraphEvent(graph, 'camera-change', ({width, height}) => {
        const previousSize = cameraSizeRef.current;
        cameraSizeRef.current = {width, height};

        if (previousSize.width !== width || previousSize.height !== height) {
            scheduleGraphFit();
        }
    });

    return (
        <React.Fragment>
            <GraphCanvas graph={graph} renderBlock={renderBlockFn} />
            <GraphControls graph={graph} />
        </React.Fragment>
    );
}
