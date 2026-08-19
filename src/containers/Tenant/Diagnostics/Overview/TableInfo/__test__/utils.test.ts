import type {ManagePartitioningFormOutput} from '../ManagePartitioningDialog/types';
import {prepareUpdatePartitioningRequest} from '../utils';

const ENABLED_VALUE: ManagePartitioningFormOutput = {
    splitSizeEnabled: true,
    splitSize: 2,
    splitUnit: 'gb',
    loadEnabled: true,
    minimum: 4,
    maximum: 100,
};

describe('prepareUpdatePartitioningRequest', () => {
    test('includes the partition size when split-by-size is enabled', () => {
        expect(prepareUpdatePartitioningRequest(ENABLED_VALUE, '/Root', '/Root/table')).toEqual({
            database: '/Root',
            path: '/Root/table',
            value: {
                splitBySize: true,
                partitionSizeMb: 2000,
                minPartitions: 4,
                maxPartitions: 100,
                splitByLoad: true,
            },
        });
    });

    test('omits the partition size when split-by-size is disabled', () => {
        const disabledValue: ManagePartitioningFormOutput = {
            ...ENABLED_VALUE,
            splitSizeEnabled: false,
            splitSize: undefined,
        };

        const result = prepareUpdatePartitioningRequest(disabledValue, '/Root', '/Root/table');

        expect(result).toEqual({
            database: '/Root',
            path: '/Root/table',
            value: {
                splitBySize: false,
                minPartitions: 4,
                maxPartitions: 100,
                splitByLoad: true,
            },
        });
    });
});
