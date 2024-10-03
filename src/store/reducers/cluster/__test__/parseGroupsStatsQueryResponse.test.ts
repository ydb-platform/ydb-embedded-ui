import {parseGroupsStatsQueryResponse} from '../utils';

describe('parseGroupsStatsQueryResponse', () => {
    const columns = [
        {
            name: 'PDiskFilter',
            type: 'Utf8?',
        },
        {
            name: 'ErasureSpecies',
            type: 'Utf8?',
        },
        {
            name: 'CurrentAvailableSize',
            type: 'Uint64?',
        },
        {
            name: 'CurrentAllocatedSize',
            type: 'Uint64?',
        },
        {
            name: 'CurrentGroupsCreated',
            type: 'Uint32?',
        },
        {
            name: 'AvailableGroupsToCreate',
            type: 'Uint32?',
        },
    ];

    // 2 disk types and 2 erasure types
    const dataSet1 = {
        result: [
            {
                columns,
                rows: [
                    ['Type:SSD', 'block-4-2', '1000', '2000', 100, 50],
                    ['Type:ROT', 'block-4-2', '2000', '1000', 50, 0],
                    ['Type:ROT', 'mirror-3of4', '1000', '0', 15, 0],
                    ['Type:SSD', 'mirror-3of4', '1000', '0', 5, 50],
                    ['Type:ROT', 'mirror-3-dc', null, null, null, 0],
                    ['Type:SSD', 'mirror-3-dc', null, null, null, 0],
                ],
            },
        ],
    };

    // 2 disk types and 1 erasure types, but with additional disks params
    const dataSet2 = {
        result: [
            {
                columns,
                rows: [
                    [
                        'Type:ROT,SharedWithOs:0,ReadCentric:0,Kind:0',
                        'mirror-3-dc',
                        '1000',
                        '500',
                        16,
                        16,
                    ],
                    [
                        'Type:ROT,SharedWithOs:1,ReadCentric:0,Kind:0',
                        'mirror-3-dc',
                        '2000',
                        '1000',
                        8,
                        24,
                    ],
                    ['Type:SSD', 'mirror-3-dc', '3000', '400', 2, 10],
                    ['Type:ROT', 'mirror-3-dc', null, null, null, 32],
                    ['Type:ROT', 'block-4-2', null, null, null, 20],
                    ['Type:SSD', 'block-4-2', null, null, null, 0],
                ],
            },
        ],
    };
    const parsedDataSet1 = {
        HDD: {
            'block-4-2': {
                allocatedSize: 1000,
                availableSize: 2000,
                createdGroups: 50,
                diskType: 'HDD',
                erasure: 'block-4-2',
                totalGroups: 50,
            },
            'mirror-3of4': {
                allocatedSize: 0,
                availableSize: 1000,
                createdGroups: 15,
                diskType: 'HDD',
                erasure: 'mirror-3of4',
                totalGroups: 15,
            },
        },
        SSD: {
            'block-4-2': {
                allocatedSize: 2000,
                availableSize: 1000,
                createdGroups: 100,
                diskType: 'SSD',
                erasure: 'block-4-2',
                totalGroups: 150,
            },
            'mirror-3of4': {
                allocatedSize: 0,
                availableSize: 1000,
                createdGroups: 5,
                diskType: 'SSD',
                erasure: 'mirror-3of4',
                totalGroups: 55,
            },
        },
    };

    const parsedDataSet2 = {
        HDD: {
            'mirror-3-dc': {
                allocatedSize: 1500,
                availableSize: 3000,
                createdGroups: 24,
                diskType: 'HDD',
                erasure: 'mirror-3-dc',
                totalGroups: 64,
            },
        },
        SSD: {
            'mirror-3-dc': {
                allocatedSize: 400,
                availableSize: 3000,
                createdGroups: 2,
                diskType: 'SSD',
                erasure: 'mirror-3-dc',
                totalGroups: 12,
            },
        },
    };
    it('should correctly parse data', () => {
        expect(parseGroupsStatsQueryResponse(dataSet1)).toEqual(parsedDataSet1);
        expect(parseGroupsStatsQueryResponse(dataSet2)).toEqual(parsedDataSet2);
    });
});
