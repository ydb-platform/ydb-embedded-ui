import type {TNodeInfo} from '../../../../types/api/nodes';
import {TPDiskState} from '../../../../types/api/pdisk';
import {EVDiskState} from '../../../../types/api/vdisk';
import type {TVDiskID} from '../../../../types/api/vdisk';
import {calculateMaximumSlotsPerDisk} from '../utils';

const createVDiskId = (id: number): TVDiskID => ({
    GroupID: id,
    GroupGeneration: 1,
    Ring: 1,
    Domain: 1,
    VDisk: id,
});

describe('calculateMaximumSlotsPerDisk', () => {
    test('should return providedMaximumSlotsPerDisk when it is provided', () => {
        const nodes: TNodeInfo[] = [];
        const providedMaximumSlotsPerDisk = '5';

        expect(calculateMaximumSlotsPerDisk(nodes, providedMaximumSlotsPerDisk)).toBe('5');
    });

    test('should return "1" for empty nodes array', () => {
        const nodes: TNodeInfo[] = [];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('1');
    });

    test('should return "1" for undefined nodes', () => {
        expect(calculateMaximumSlotsPerDisk(undefined)).toBe('1');
    });

    test('should return "1" for nodes without PDisks or VDisks', () => {
        const nodes: TNodeInfo[] = [
            {
                NodeId: 1,
                SystemState: {},
            },
        ];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('1');
    });

    test('should calculate maximum slots correctly for single node with one PDisk and multiple VDisks', () => {
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
                VDisks: [
                    {
                        VDiskId: createVDiskId(1),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(2),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
                    },
                ],
            },
        ];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('2');
    });

    test('should calculate maximum slots across multiple nodes', () => {
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
                VDisks: [
                    {
                        VDiskId: createVDiskId(1),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
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
                ],
                VDisks: [
                    {
                        VDiskId: createVDiskId(2),
                        PDiskId: 2,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(3),
                        PDiskId: 2,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(4),
                        PDiskId: 2,
                        VDiskState: EVDiskState.OK,
                    },
                ],
            },
        ];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('3');
    });

    test('should handle nodes with multiple PDisks', () => {
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
                ],
                VDisks: [
                    {
                        VDiskId: createVDiskId(1),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(2),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(3),
                        PDiskId: 2,
                        VDiskState: EVDiskState.OK,
                    },
                ],
            },
        ];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('2');
    });

    test('should ignore VDisks with non-matching PDiskId', () => {
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
                VDisks: [
                    {
                        VDiskId: createVDiskId(1),
                        PDiskId: 1,
                        VDiskState: EVDiskState.OK,
                    },
                    {
                        VDiskId: createVDiskId(2),
                        PDiskId: 2, // Non-matching PDiskId
                        VDiskState: EVDiskState.OK,
                    },
                ],
            },
        ];

        expect(calculateMaximumSlotsPerDisk(nodes)).toBe('1');
    });
});
