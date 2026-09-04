import type {ClusterGroupsStats} from '../../../../../../store/reducers/cluster/types';
import {prepareClusterGroupsStats} from '../utils';

const createStats = (
    diskType: string,
    erasure: string,
    createdGroups: number,
    availableGroups: number,
) => ({
    allocatedSize: 0,
    availableSize: 0,
    createdGroups,
    diskType,
    erasure,
    totalGroups: createdGroups + availableGroups,
});

describe('prepareClusterGroupsStats', () => {
    test('calculates totals and the midpoint of the available range', () => {
        const groupStats: ClusterGroupsStats = {
            SSD: {
                'mirror-3-dc': createStats('SSD', 'mirror-3-dc', 50, 227),
                'block-4-2': createStats('SSD', 'block-4-2', 542, 225),
            },
            HDD: {
                'mirror-3-dc': createStats('HDD', 'mirror-3-dc', 60, 202),
                'block-4-2': createStats('HDD', 'block-4-2', 65, 199),
            },
        };

        expect(prepareClusterGroupsStats(groupStats)).toEqual({
            allocatedGroups: 717,
            disks: [
                {
                    allocatedGroups: 125,
                    availableGroups: {
                        average: 200.5,
                        max: 202,
                        min: 199,
                    },
                    diskType: 'HDD',
                    erasures: [
                        {
                            availableGroups: 199,
                            createdGroups: 65,
                            erasure: 'block-4-2',
                        },
                        {
                            availableGroups: 202,
                            createdGroups: 60,
                            erasure: 'mirror-3-dc',
                        },
                    ],
                    progressTotalGroups: 325.5,
                },
                {
                    allocatedGroups: 592,
                    availableGroups: {
                        average: 226,
                        max: 227,
                        min: 225,
                    },
                    diskType: 'SSD',
                    erasures: [
                        {
                            availableGroups: 225,
                            createdGroups: 542,
                            erasure: 'block-4-2',
                        },
                        {
                            availableGroups: 227,
                            createdGroups: 50,
                            erasure: 'mirror-3-dc',
                        },
                    ],
                    progressTotalGroups: 818,
                },
            ],
        });
    });

    test('includes zero availability when calculating the midpoint', () => {
        const groupStats: ClusterGroupsStats = {
            HDD: {
                'block-4-2': createStats('HDD', 'block-4-2', 65, 0),
                'mirror-3-dc': createStats('HDD', 'mirror-3-dc', 0, 202),
            },
        };

        expect(prepareClusterGroupsStats(groupStats)).toEqual({
            allocatedGroups: 65,
            disks: [
                {
                    allocatedGroups: 65,
                    availableGroups: {
                        average: 101,
                        max: 202,
                        min: 0,
                    },
                    diskType: 'HDD',
                    erasures: [
                        {
                            availableGroups: 0,
                            createdGroups: 65,
                            erasure: 'block-4-2',
                        },
                        {
                            availableGroups: 202,
                            createdGroups: 0,
                            erasure: 'mirror-3-dc',
                        },
                    ],
                    progressTotalGroups: 166,
                },
            ],
        });
    });

    test('orders none after mirror erasures and estimates only from supplied policies', () => {
        const groupStats: ClusterGroupsStats = {
            HDD: {
                none: createStats('HDD', 'none', 12, 0),
                'block-4-2': createStats('HDD', 'block-4-2', 65, 199),
                'mirror-3of4': createStats('HDD', 'mirror-3of4', 60, 202),
            },
        };

        expect(prepareClusterGroupsStats(groupStats)).toEqual({
            allocatedGroups: 137,
            disks: [
                {
                    allocatedGroups: 137,
                    availableGroups: {
                        average: 101,
                        max: 202,
                        min: 0,
                    },
                    diskType: 'HDD',
                    erasures: [
                        {
                            availableGroups: 199,
                            createdGroups: 65,
                            erasure: 'block-4-2',
                        },
                        {
                            availableGroups: 202,
                            createdGroups: 60,
                            erasure: 'mirror-3of4',
                        },
                        {
                            availableGroups: 0,
                            createdGroups: 12,
                            erasure: 'none',
                        },
                    ],
                    progressTotalGroups: 238,
                },
            ],
        });
    });

    test('does not synthesize erasure policies missing from the backend response', () => {
        const groupStats: ClusterGroupsStats = {
            SSD: {
                none: createStats('SSD', 'none', 8, 0),
                'block-4-2': createStats('SSD', 'block-4-2', 542, 225),
            },
        };

        expect(prepareClusterGroupsStats(groupStats)).toEqual({
            allocatedGroups: 550,
            disks: [
                {
                    allocatedGroups: 550,
                    availableGroups: {
                        average: 112.5,
                        max: 225,
                        min: 0,
                    },
                    diskType: 'SSD',
                    erasures: [
                        {
                            availableGroups: 225,
                            createdGroups: 542,
                            erasure: 'block-4-2',
                        },
                        {
                            availableGroups: 0,
                            createdGroups: 8,
                            erasure: 'none',
                        },
                    ],
                    progressTotalGroups: 662.5,
                },
            ],
        });
    });
});
