import React from 'react';

import type {
    ExplainPlanNodeData,
    GraphNode,
    Link,
    Options,
    Shapes,
    Topology,
} from '@gravity-ui/paranoid';
import {getTopology, getYdbPlanNodeShape} from '@gravity-ui/paranoid';

import type {PreparedExplainResponse} from '../../../../../../store/reducers/explainQuery/types';
import {explainVersions} from '../../../../../../store/reducers/explainQuery/utils';
import {cn} from '../../../../../../utils/cn';

import {renderExplainNode} from './utils';

import './Graph.scss';

const b = cn('ydb-query-explain-graph');

interface GraphRootProps {
    data: {links: Link[]; nodes: GraphNode<ExplainPlanNodeData>[]};
    opts: Options;
    shapes: Shapes;
    theme: string;
}

function GraphRoot({data, opts, shapes, theme}: GraphRootProps) {
    const paranoid = React.useRef<Topology>();
    React.useEffect(() => {
        const graphRoot = document.getElementById('graphRoot');

        if (!graphRoot) {
            throw new Error("Can't find element with id #graphRoot");
        }

        graphRoot.innerHTML = '';

        paranoid.current = getTopology('graphRoot', data, opts, shapes);
        paranoid.current.render();
        return () => {
            paranoid.current = undefined;
        };
    }, [theme]);

    return <div id="graphRoot" style={{height: '100vh'}} />;
}

interface GraphProps {
    explain: PreparedExplainResponse['plan'];
    theme: string;
}

export function Graph({explain, theme}: GraphProps) {
    const {links, nodes, version} = explain ?? {};

    const isSupportedVersion = version === explainVersions.v2;
    const isEnoughDataForGraph = links && nodes && nodes.length;

    const content =
        isSupportedVersion && isEnoughDataForGraph ? (
            <div className={b('canvas-container')}>
                <GraphRoot
                    theme={theme}
                    data={{links, nodes}}
                    opts={{
                        renderNodeTitle: renderExplainNode,
                        textOverflow: 'normal',
                        initialZoomFitsCanvas: true,
                    }}
                    shapes={{
                        node: getYdbPlanNodeShape,
                    }}
                />
            </div>
        ) : null;
    return content;
}
