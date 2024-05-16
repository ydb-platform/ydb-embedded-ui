import type {GraphNode} from '@gravity-ui/paranoid';

export const renderExplainNode = (node: GraphNode): string => {
    const parts = node.name.split('|');
    return parts.length > 1 ? parts[1] : node.name;
};
