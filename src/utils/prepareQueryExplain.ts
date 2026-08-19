import type {
    ExplainPlanNodeData,
    GraphNode,
    Link,
    SimplifiedPlanItem,
    TopologyNodeDataStats,
    TopologyNodeDataStatsItem,
    TopologyNodeDataStatsSection,
} from '../store/reducers/query/types';
import type {PlanNode, SimplifiedNode} from '../types/api/query';

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

                const value = typeof data === 'string' ? data : JSON.stringify(data);
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

            attrStats.push({
                name: key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
            });
        }

        if (attrStats.length > 0) {
            stats.push({
                group: 'Attributes',
                stats: attrStats,
            });
        }
    }

    if (plan.Stats) {
        const attrStats: TopologyNodeDataStatsItem[] = [];

        for (const [key, value] of Object.entries(plan.Stats)) {
            attrStats.push({
                name: key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
            });
        }

        stats.push({
            group: 'Stats',
            stats: attrStats,
        });
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
    const nodes: GraphNode<ExplainPlanNodeData>[] = [];
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

export function prepareSimplifiedPlan(plans: SimplifiedNode[]): SimplifiedPlanItem[] {
    const result: SimplifiedPlanItem[] = [];
    const stack: {
        node: SimplifiedNode;
        subNodes?: SimplifiedPlanItem[];
    }[] = plans.map((plan) => ({node: plan}));

    while (stack.length > 0) {
        const {node, subNodes} = stack.pop()!;
        const plans = node['Plans'];
        const operator = node['Operators']?.[0];

        const children = subNodes || result;

        if (operator) {
            const {
                ['A-Cpu']: aCpu,
                ['A-Rows']: aRows,
                ['E-Cost']: eCost,
                ['E-Rows']: eRows,
                ['E-Size']: eSize,
                ['SsaProgram']: _ssaProgram,
                ['Name']: name,
                ...rest
            } = operator;

            const newNode: SimplifiedPlanItem = {
                name,
                operationParams: rest,
                aCpu,
                aRows,
                eCost,
                eRows,
                eSize,
                children: [],
            };

            children.push(newNode);

            if (plans) {
                for (let i = plans.length - 1; i >= 0; i--) {
                    stack.push({node: plans[i], subNodes: newNode.children});
                }
            }
        } else if (plans) {
            for (let i = plans.length - 1; i >= 0; i--) {
                stack.push({node: plans[i], subNodes: children});
            }
        }
    }

    return result;
}
