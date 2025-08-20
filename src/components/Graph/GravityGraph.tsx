import React, { useEffect } from 'react';
import { Graph, TGraphConfig, GraphState } from "@gravity-ui/graph";
import { GraphCanvas, GraphBlock, useGraph, useElk, TBlock, TConnection, useGraphEvent, MultipointConnection } from "@gravity-ui/graph/react";
import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs';

import type { Data, GraphNode, Options, Shapes } from '@gravity-ui/paranoid';

interface Props<T> {
    data: Data<T>;
}

const config = {
    settings: {
        connection: MultipointConnection
    }
};
const elk = new ELK();

const renderBlockFn = (graph, block) => {
    return <GraphBlock graph={graph} block={block}>{block.id}</GraphBlock>;
};

const prepareChildren = (blocks: TGraphConfig["blocks"]) => {
    return blocks.map((b) => {
        return {
            id: b.id as string,
            width: b.width,
            height: b.height,
        } satisfies ElkNode;
    });
};

const prepareEdges = (connections: TGraphConfig["connections"], skipLabels?: boolean) => {
    return connections.map((c, i) => {
        const labelText = `label ${i}`;

        return {
            id: c.id as string,
            sources: [c.sourceBlockId as string],
            targets: [c.targetBlockId as string],
            //   labels: skipLabels
            //     ? []
            //     : [{ text: labelText, width: measureText(labelText, `${FONT_SIZE}px sans-serif`), height: FONT_SIZE }],
        } satisfies ElkExtendedEdge;
    });
};



const _blocks = [
    {
        width: 200,
        height: 160,
        id: "Left",
        is: "Block",
        selected: false,
        name: "Left block",
        anchors: [],
    },
    {
        width: 200,
        height: 160,
        id: "Right",
        is: "Block",
        selected: false,
        name: "Right block",
        anchors: [],
    }
]

const _connections = [
    {
        id: "c1",
        sourceBlockId: "Left",
        targetBlockId: "Right",
    }
]

const elkConfig = {
    id: "root",
    children: prepareChildren(_blocks),
    edges: prepareEdges(_connections),
    layoutOptions: {
        'elk.algorithm': 'mrtree',
        'elk.direction': 'DOWN',
        'elk.spacing.edgeNode': '50',
        'elk.spacing.nodeNode': '50'
    }
};

export function GravityGraph<T>({ data }: Props<T>) {
    console.log(data);

    const { graph, start } = useGraph(config);
    const { isLoading, result } = useElk(elkConfig, elk);

    React.useEffect(() => {

        if (isLoading || !result) {
            return;
        }

        console.log('result', result);


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

        console.log('connections', connections);


        graph.setEntities({
            blocks,
            connections,
        });
    }, [isLoading, result, graph]);

    useGraphEvent(graph, "state-change", ({ state }) => {
        if (state === GraphState.ATTACHED) {
            console.log('start')
            start();
        }
    });

    return <GraphCanvas graph={graph} renderBlock={renderBlockFn} />
}
