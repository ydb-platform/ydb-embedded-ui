import type {TBlock, TConnection, TGraphConfig} from '@gravity-ui/graph';
import type {Data, GraphNode, Options, Shapes} from '@gravity-ui/paranoid';
import type {ElkExtendedEdge, ElkNode} from 'elkjs';

export const prepareChildren = (blocks: TGraphConfig['blocks']) => {
    return blocks?.map((b) => {
        return {
            id: b.id as string,
            width: b.width,
            height: b.height,
            ports: [
                {
                    id: `port_${b.id as string}`,
                },
            ],
            // properties: {
            //     'elk.portConstraints': 'FIXED_ORDER',
            //     // 'elk.spacing.portPort': '0',
            // },
        } satisfies ElkNode;
    });
};

export const prepareEdges = (connections: TGraphConfig['connections'], skipLabels?: boolean) => {
    return connections?.map((c, i) => {
        const labelText = `label ${i}`;

        return {
            id: c.id as string,
            sources: [`port_${c.sourceBlockId as string}`],
            // sources: [c.sourceBlockId as string],
            targets: [c.targetBlockId as string],
            // labels: skipLabels ? [] : [{text: labelText, width: 50, height: 14}],
        } satisfies ElkExtendedEdge;
    });
};

export const prepareBlocks = (nodes: Data['nodes']): TBlock[] => {
    return nodes?.map(({data: {id, name, ...rest}}) => ({
        id: String(id),
        name,
        width: 200,
        height: 100,
        ...rest,
    }));
};

export const prepareConnections = (links: Data['links']): TConnection[] => {
    return links?.map(({from, to}) => ({
        id: `${from}:${to}`,
        sourceBlockId: from,
        targetBlockId: to,
    }));
};
