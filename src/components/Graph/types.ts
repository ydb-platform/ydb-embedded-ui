import type {TBlock, TBlockId, TConnection, TMultipointConnection} from '@gravity-ui/graph';

import type {GraphNode, Link, TopologyNodeDataStats} from '../../store/reducers/query/types';

// Extended block interface with additional properties
export interface ExtendedTBlock extends TBlock {
    planNodeId?: number;
    stats?: TopologyNodeDataStats[];
    operators?: string[];
    tables?: string[];
}
export type LinkType = 'arrow' | 'line';
export interface Data<TData = any> {
    links: Link[];
    nodes: GraphNode<TData>[];
}

// TreeLayout related types
export interface LayoutOptions {
    horizontalSpacing?: number;
    padding?: number;
    verticalSpacing?: number;
}

export interface TreeNode {
    id: string;
    level: number;
    block: any;
    children: TreeNode[];
    subtreeWidth: number;
    x: number;
    y: number;
}

export type EdgeResult = TMultipointConnection & {
    connectionId: string | undefined;
    points: Array<{x: number; y: number}>;
    sourceBlockId: TBlockId;
    targetBlockId: TBlockId;
};

export type TreeLayoutRequest = Pick<Data, 'links' | 'nodes'>;

export interface TreeLayoutResult {
    layout: ExtendedTBlock[];
    edges: EdgeResult[];
}

export type TreeLayoutWorkerResponse =
    | {type: 'success'; result: TreeLayoutResult}
    | {type: 'error'; error: string};

export type TreeConnection = TConnection & {
    sourceBlockId: TBlockId;
    targetBlockId: TBlockId;
};
