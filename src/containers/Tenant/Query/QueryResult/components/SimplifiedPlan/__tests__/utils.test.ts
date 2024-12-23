import type {SimplifiedPlanItem} from '../../../../../../../store/reducers/query/types';
import type {ExtendedSimplifiesPlanItem} from '../types';
import {getExtendedTreeNodes} from '../utils';

describe('getExtendedTreeNodes', () => {
    test('should handle empty input', () => {
        const result = getExtendedTreeNodes();
        expect(result).toEqual([]);
    });

    test('should handle single node without children', () => {
        const items: SimplifiedPlanItem[] = [
            {
                name: 'TestNode',
                operationParams: {},
            },
        ];

        const expected: ExtendedSimplifiesPlanItem[] = [
            {
                name: 'TestNode',
                operationParams: {},
                lines: '0',
            },
        ];

        const result = getExtendedTreeNodes(items);
        expect(result).toEqual(expected);
    });

    test('should handle nested nodes', () => {
        const items: SimplifiedPlanItem[] = [
            {
                name: 'RootNode',
                operationParams: {},
                children: [
                    {
                        name: 'ChildNode1',
                        operationParams: {},
                    },
                    {
                        name: 'ChildNode2',
                        operationParams: {},
                        children: [
                            {
                                name: 'GrandChildNode',
                                operationParams: {},
                            },
                        ],
                    },
                ],
            },
        ];

        const expected: ExtendedSimplifiesPlanItem[] = [
            {
                name: 'RootNode',
                operationParams: {},
                lines: '0',
                children: [
                    {
                        name: 'ChildNode1',
                        operationParams: {},
                        lines: '0.1',
                    },
                    {
                        name: 'ChildNode2',
                        operationParams: {},
                        lines: '0.0',
                        children: [
                            {
                                name: 'GrandChildNode',
                                operationParams: {},
                                lines: '0.0.0',
                            },
                        ],
                    },
                ],
            },
        ];

        const result = getExtendedTreeNodes(items);
        expect(result).toEqual(expected);
    });

    test('should handle multiple root nodes', () => {
        const items: SimplifiedPlanItem[] = [
            {
                name: 'RootNode1',
                operationParams: {},
            },
            {
                name: 'RootNode2',
                operationParams: {},
                children: [
                    {
                        name: 'ChildNode',
                        operationParams: {},
                    },
                ],
            },
        ];

        const expected: ExtendedSimplifiesPlanItem[] = [
            {
                name: 'RootNode1',
                operationParams: {},
                lines: '1',
            },
            {
                name: 'RootNode2',
                operationParams: {},
                lines: '0',
                children: [
                    {
                        name: 'ChildNode',
                        operationParams: {},
                        lines: '0.0',
                    },
                ],
            },
        ];

        const result = getExtendedTreeNodes(items);
        expect(result).toEqual(expected);
    });
});
