import type {TNodeInfo} from '../../../../types/api/nodes';
import {TPDiskState} from '../../../../types/api/pdisk';
import {calculateMaximumDisksPerNode} from '../utils';

describe('calculateMaximumDisksPerNode', () => {
    test('should return providedMaximumDisksPerNode when it is provided', () => {
        const nodes: TNodeInfo[] = [];
        const providedMaximumDisksPerNode = '5';

        expect(calculateMaximumDisksPerNode(nodes, providedMaximumDisksPerNode)).toBe('5');
    });

    test('should return "1" for empty nodes array', () => {
        const nodes: TNodeInfo[] = [];

        expect(calculateMaximumDisksPerNode(nodes)).toBe('1');
    });

    test('should return "1" for undefined nodes', () => {
        expect(calculateMaximumDisksPerNode(undefined)).toBe('1');
    });

    test('should return "1" for nodes without PDisks', () => {
        const nodes: TNodeInfo[] = [
            {
                NodeId: 1,
                SystemState: {},
            },
        ];

        expect(calculateMaximumDisksPerNode(nodes)).toBe('1');
    });

    test('should calculate maximum disks correctly for single node with multiple PDisks', () => {
        const nodes: TNodeInfo[] = [
            {
                NodeId: 1,
                SystemState: {},
                PDisks: [
                    {
                        PDiskId: 1,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 2,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 3,
                        State: TPDiskState.Normal,
                    },
                ],
            },
        ];

        expect(calculateMaximumDisksPerNode(nodes)).toBe('3');
    });

    test('should calculate maximum disks across multiple nodes', () => {
        const nodes: TNodeInfo[] = [
            {
                NodeId: 1,
                SystemState: {},
                PDisks: [
                    {
                        PDiskId: 1,
                        State: TPDiskState.Normal,
                    },
                ],
            },
            {
                NodeId: 2,
                SystemState: {},
                PDisks: [
                    {
                        PDiskId: 2,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 3,
                        State: TPDiskState.Normal,
                    },
                ],
            },
            {
                NodeId: 3,
                SystemState: {},
                PDisks: [
                    {
                        PDiskId: 4,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 5,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 6,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 7,
                        State: TPDiskState.Normal,
                    },
                ],
            },
        ];

        expect(calculateMaximumDisksPerNode(nodes)).toBe('4');
    });

    test('should handle nodes with empty PDisks array', () => {
        const nodes: TNodeInfo[] = [
            {
                NodeId: 1,
                SystemState: {},
                PDisks: [],
            },
            {
                NodeId: 2,
                SystemState: {},
                PDisks: [
                    {
                        PDiskId: 1,
                        State: TPDiskState.Normal,
                    },
                    {
                        PDiskId: 2,
                        State: TPDiskState.Normal,
                    },
                ],
            },
        ];

        expect(calculateMaximumDisksPerNode(nodes)).toBe('2');
    });
});
