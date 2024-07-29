import React from 'react';

import {getTopology, getYdbPlanNodeShape} from '@gravity-ui/paranoid';
import type {Data, GraphNode, Options, Shapes} from '@gravity-ui/paranoid';

interface GraphProps<T> {
    data: Data<T>;
    opts?: Options;
    shapes?: Shapes;
}

export function Graph<T>(props: GraphProps<T>) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const containerId = React.useId();

    const {data, opts, shapes} = props;

    React.useEffect(() => {
        const graphRoot = containerRef.current;
        if (!graphRoot) {
            return undefined;
        }

        graphRoot.innerHTML = '';

        const topology = getTopology(graphRoot.id, data, opts, shapes);
        topology.render();
        return () => {
            topology.destroy();
        };
    }, [data, opts, shapes]);

    return <div id={containerId} ref={containerRef} style={{height: '100vh'}} />;
}

export const renderExplainNode = (node: GraphNode): string => {
    const parts = node.name.split('|');
    return parts.length > 1 ? parts[1] : node.name;
};

const schemaOptions: Options = {
    renderNodeTitle: renderExplainNode,
    textOverflow: 'normal' as const,
    initialZoomFitsCanvas: true,
};

const schemaShapes = {
    node: getYdbPlanNodeShape,
};

interface YDBGraphProps<T> {
    data: Data<T>;
}

export function YDBGraph<T>(props: YDBGraphProps<T>) {
    return <Graph<T> {...props} opts={schemaOptions} shapes={schemaShapes} />;
}
