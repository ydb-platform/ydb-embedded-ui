import type {TBlock} from '@gravity-ui/graph';

export interface GraphNode<TData = any> {
    name: string;
    status?: string;
    meta?: string;
    group?: string;
    data?: TData;
    metrics?: Metric[];
}

// Extended block interface with additional properties
export interface ExtendedTBlock extends TBlock {
    stats?: TopologyNodeDataStats[];
    operators?: string[];
    tables?: string[];
}
export type LinkType = 'arrow' | 'line';
export interface Link {
    from: string;
    to: string;
}
export interface Data<TData = any> {
    links?: Link[];
    nodes: GraphNode<TData>[];
}
export interface Metric {
    name: string;
    value: string;
    theme?: 'warning' | 'danger';
}
export interface ExplainPlanNodeData {
    id?: number;
    type: 'query' | 'result' | 'stage' | 'connection' | 'materialize';
    name?: string;
    operators?: string[];
    tables?: string[];
    cte?: string;
    stats?: TopologyNodeDataStats[];
}
export interface TopologyNodeDataStatsItem {
    name: string;
    value: string | number;
}
export interface TopologyNodeDataStatsSection {
    name: string;
    items: TopologyNodeDataStatsItem[];
}
export interface TopologyNodeDataStats {
    group: string;
    stats: TopologyNodeDataStatsSection[] | TopologyNodeDataStatsItem[];
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
