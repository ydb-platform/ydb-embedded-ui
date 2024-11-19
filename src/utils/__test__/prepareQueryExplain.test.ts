import type {SimplifiedPlanItem} from '../../store/reducers/query/types';
import type {SimplifiedNode} from '../../types/api/query';
import {prepareSimplifiedPlan} from '../prepareQueryExplain';

describe('prepareSimplifiedPlan', () => {
    test('should handle empty input', () => {
        const plans: SimplifiedNode[] = [];
        const result = prepareSimplifiedPlan(plans);
        expect(result).toEqual([]);
    });

    test('should handle single node without children', () => {
        const plans: SimplifiedNode[] = [
            {
                Operators: [
                    {
                        ['A-Cpu']: 10,
                        ['A-Rows']: 100,
                        ['E-Cost']: '20',
                        ['E-Rows']: '200',
                        ['E-Size']: '50',
                        ['Name']: 'TestNode',
                        testParams: {foo: 'bar'},
                    },
                ],
            },
        ];

        const expected: SimplifiedPlanItem[] = [
            {
                name: 'TestNode',
                operationParams: {testParams: {foo: 'bar'}},
                aCpu: 10,
                aRows: 100,
                eCost: '20',
                eRows: '200',
                eSize: '50',
                children: [],
            },
        ];

        const result = prepareSimplifiedPlan(plans);
        expect(result).toEqual(expected);
    });

    test('should handle nested nodes', () => {
        const plans: SimplifiedNode[] = [
            {
                Operators: [
                    {
                        ['A-Cpu']: 10,
                        ['A-Rows']: 100,
                        ['E-Cost']: '20',
                        ['E-Rows']: '200',
                        ['E-Size']: '50',
                        ['Name']: 'RootNode',
                        testParams: {foo: 'bar'},
                    },
                ],
                Plans: [
                    {
                        Operators: [
                            {
                                ['A-Cpu']: 5,
                                ['A-Rows']: 50,
                                ['E-Cost']: '10',
                                ['E-Rows']: '100',
                                ['E-Size']: '25',
                                ['Name']: 'ChildNode',
                                testParams: {foo: 'bar'},
                            },
                        ],
                    },
                ],
            },
        ];

        const expected: SimplifiedPlanItem[] = [
            {
                name: 'RootNode',
                operationParams: {testParams: {foo: 'bar'}},
                aCpu: 10,
                aRows: 100,
                eCost: '20',
                eRows: '200',
                eSize: '50',
                children: [
                    {
                        name: 'ChildNode',
                        operationParams: {testParams: {foo: 'bar'}},
                        aCpu: 5,
                        aRows: 50,
                        eCost: '10',
                        eRows: '100',
                        eSize: '25',
                        children: [],
                    },
                ],
            },
        ];

        const result = prepareSimplifiedPlan(plans);
        expect(result).toEqual(expected);
    });

    test('should handle nodes without operators', () => {
        const plans: SimplifiedNode[] = [
            {
                PlanNodeId: 0,
                'Node Type': 'Query',
                PlanNodeType: 'Query',
                Plans: [
                    {
                        PlanNodeId: 1,
                        'Node Type': 'TableScan',
                        PlanNodeType: 'TableScan',
                    },
                ],
            },
        ];

        const expected: SimplifiedPlanItem[] = [];

        const result = prepareSimplifiedPlan(plans);
        expect(result).toEqual(expected);
    });
});
