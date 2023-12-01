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
        columns,
        result: [
            ['Type:SSD', 'block-4-2', '1000', '2000', 100, 50],
            ['Type:ROT', 'block-4-2', '2000', '1000', 50, 0],
            ['Type:ROT', 'mirror-3of4', '1000', '0', 15, 0],
            ['Type:SSD', 'mirror-3of4', '1000', '0', 5, 50],
            ['Type:ROT', 'mirror-3-dc', null, null, null, 0],
            ['Type:SSD', 'mirror-3-dc', null, null, null, 0],
        ],
    };

    // 2 disk types and 1 erasure types, but with additional disks params
    const dataSet2 = {
        columns,
        result: [
            ['Type:ROT,SharedWithOs:0,ReadCentric:0,Kind:0', 'mirror-3-dc', '1000', '500', 16, 16],
            ['Type:ROT,SharedWithOs:1,ReadCentric:0,Kind:0', 'mirror-3-dc', '2000', '1000', 8, 24],
            ['Type:SSD', 'mirror-3-dc', '3000', '400', 2, 10],
            ['Type:ROT', 'mirror-3-dc', null, null, null, 32],
            ['Type:ROT', 'block-4-2', null, null, null, 20],
            ['Type:SSD', 'block-4-2', null, null, null, 0],
        ],
    };
    const parsedDataSet1 = {
        SSD: {
            'block-4-2': {
                diskType: 'SSD',
                erasure: 'block-4-2',
                createdGroups: 100,
                totalGroups: 150,
                allocatedSize: 2000,
                availableSize: 1000,
            },
            'mirror-3of4': {
                diskType: 'SSD',
                erasure: 'mirror-3of4',
                createdGroups: 5,
                totalGroups: 55,
                allocatedSize: 0,
                availableSize: 1000,
            },
        },
        HDD: {
            'block-4-2': {
                diskType: 'HDD',
                erasure: 'block-4-2',
                createdGroups: 50,
                totalGroups: 50,
                allocatedSize: 1000,
                availableSize: 2000,
            },
            'mirror-3of4': {
                diskType: 'HDD',
                erasure: 'mirror-3of4',
                createdGroups: 15,
                totalGroups: 15,
                allocatedSize: 0,
                availableSize: 1000,
            },
        },
    };

    const parsedDataSet2 = {
        HDD: {
            'mirror-3-dc': {
                diskType: 'HDD',
                erasure: 'mirror-3-dc',
                createdGroups: 24,
                totalGroups: 64,
                allocatedSize: 1500,
                availableSize: 3000,
            },
        },
        SSD: {
            'mirror-3-dc': {
                diskType: 'SSD',
                erasure: 'mirror-3-dc',
                createdGroups: 2,
                totalGroups: 12,
                allocatedSize: 400,
                availableSize: 3000,
            },
        },
    };
    it('should correctly parse data', () => {
        expect(parseGroupsStatsQueryResponse(dataSet1)).toEqual(parsedDataSet1);
        expect(parseGroupsStatsQueryResponse(dataSet2)).toEqual(parsedDataSet2);
    });
});
