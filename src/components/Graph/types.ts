import type {TBlock} from '@gravity-ui/graph';

import type {GraphNode, Link, TopologyNodeDataStats} from '../../store/reducers/query/types';

// Extended block interface with additional properties
export interface ExtendedTBlock extends TBlock {
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

export interface EdgeResult {
    points: Array<{x: number; y: number}>;
    sourceBlockId: string;
    targetBlockId: string;
}
