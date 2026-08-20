import type {PlanNode} from '../../types/api/query';
import {preparePlan} from '../../utils/prepareQueryExplain';

import {prepareTreeLayout} from './treeLayout';

describe('prepareTreeLayout', () => {
    test('lays out connected plan nodes when PlanNodeId is missing', () => {
        const plan: PlanNode = {
            PlanNodeType: 'Query',
            Plans: [
                {
                    PlanNodeType: 'Stage',
                    Plans: [{PlanNodeType: 'Stage'}],
                },
            ],
        };

        const result = prepareTreeLayout(preparePlan(plan));

        expect(result.layout.map(({id}) => id)).toEqual([
            'generated-plan-node:0',
            'generated-plan-node:1',
            'generated-plan-node:2',
        ]);
        expect(
            result.edges.map(({sourceBlockId, targetBlockId}) => ({
                sourceBlockId,
                targetBlockId,
            })),
        ).toEqual([
            {
                sourceBlockId: 'generated-plan-node:0',
                targetBlockId: 'generated-plan-node:1',
            },
            {
                sourceBlockId: 'generated-plan-node:1',
                targetBlockId: 'generated-plan-node:2',
            },
        ]);
    });
});
