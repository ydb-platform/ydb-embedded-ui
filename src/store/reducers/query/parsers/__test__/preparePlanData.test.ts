import type {TKqpStatsQuery} from '../../../../../types/api/query';
import {preparePlanData} from '../preparePlanData';

describe('preparePlanData', () => {
    test('prepares graph and simplified data from a stats-only execution plan', () => {
        const planWithStats = {
            PlanNodeId: 1,
            PlanNodeType: 'Query',
            Plans: [
                {
                    PlanNodeId: 2,
                    PlanNodeType: 'Stage',
                    Operators: [
                        {
                            Name: 'TableFullScan',
                            Table: '/Root/TwoShard',
                            'A-Rows': 6,
                        },
                    ],
                },
            ],
        };
        const stats: TKqpStatsQuery = {
            Executions: [
                {
                    TxPlansWithStats: [JSON.stringify(planWithStats)],
                    Extra: {},
                },
            ],
        };

        const result = preparePlanData(undefined, stats);

        expect(result.nodes).toHaveLength(2);
        expect(result.simplifiedPlan?.pristine).toEqual(planWithStats);
        expect(result.simplifiedPlan?.plan).toEqual([
            expect.objectContaining({
                name: 'TableFullScan',
                aRows: 6,
                operationParams: {
                    Table: '/Root/TwoShard',
                },
            }),
        ]);
    });
});
