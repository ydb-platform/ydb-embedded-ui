import type {
    Link,
    GraphNode,
    TopologyNodeDataStats,
    TopologyNodeDataStatsSection,
    ExplainPlanNodeData,
    TopologyNodeDataStatsItem,
} from '@gravity-ui/paranoid';

import type {PlanNode} from '../types/api/query';

const CONNECTION_NODE_META_FIELDS = new Set(['PlanNodeId', 'PlanNodeType', 'Node Type', 'Plans']);

function prepareStats(plan: PlanNode) {
    const stats: TopologyNodeDataStats[] = [];

    if (plan.Operators) {
        const operatorsSections: TopologyNodeDataStatsSection[] = [];

        for (const operator of plan.Operators) {
            const section: TopologyNodeDataStatsSection = {name: operator.Name, items: []};

            for (const [name, data] of Object.entries(operator)) {
                if (name === 'Name') {
                    continue;
                }

                const value = Array.isArray(data) ? data.join(', ') : data;
                section.items.push({name, value});
            }

            operatorsSections.push(section);
        }

        stats.push({
            group: 'Operators',
            stats: operatorsSections,
        });
    }

    if (plan.PlanNodeType === 'Connection') {
        const attrStats: TopologyNodeDataStatsItem[] = [];

        for (const [key, value] of Object.entries(plan)) {
            if (CONNECTION_NODE_META_FIELDS.has(key)) {
                continue;
            }

            attrStats.push({name: key, value: String(value)});
        }

        if (attrStats.length > 0) {
            stats.push({
                group: 'Attributes',
                stats: attrStats,
            });
        }
    }

    return stats;
}

function getNodeType(plan: PlanNode) {
    switch (plan.PlanNodeType) {
        case 'Connection':
            return 'connection';
        case 'ResultSet':
            return 'result';
        case 'Query':
            return 'query';
        default:
            return 'stage';
    }
}

export function preparePlan(plan: PlanNode) {
    const nodes: GraphNode[] = [];
    const links: Link[] = [];

    function parsePlans(plans: PlanNode[] = [], from: string) {
        plans.forEach((p) => {
            const node: GraphNode<ExplainPlanNodeData> = {
                name: String(p.PlanNodeId),
                data: {
                    id: p.PlanNodeId,
                    type: getNodeType(p),
                    name: p['Node Type'],
                    operators: p.Operators?.map((o) => o.Name),
                    stats: prepareStats(p),
                    tables: p.Tables,
                },
            };
            nodes.push(node);
            links.push({from, to: node.name});
            parsePlans(p.Plans, node.name);
        });
    }

    const rootPlan = plan;
    const rootNode: GraphNode<ExplainPlanNodeData> = {
        name: String(rootPlan.PlanNodeId),
        data: {
            id: rootPlan.PlanNodeId,
            type: getNodeType(rootPlan),
            name: rootPlan['Node Type'],
        },
    };
    nodes.push(rootNode);
    parsePlans(rootPlan.Plans, rootNode.name);

    return {
        nodes,
        links,
    };
}
