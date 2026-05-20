import {alterPartitioningSQL} from '../../../../../../store/reducers/tablePartitioning/tablePartitioning';
import {sizes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from '../constants';
import {prepareUpdatePartitioningRequest} from '../utils';

describe('prepareUpdatePartitioningRequest', () => {
    test('sets splitBySize=false and uses fallback partition size when split-by-size is disabled', () => {
        const result = prepareUpdatePartitioningRequest(
            {
                splitSizeEnabled: false,
                splitSize: '',
                splitUnit: 'gb',
                loadEnabled: true,
                minimum: '3',
                maximum: '10',
            },
            '/Root',
            '/Root/table',
        );

        expect(result).toEqual({
            database: '/Root',
            path: '/Root/table',
            value: {
                splitBySize: false,
                splitByLoad: true,
                partitionSizeMb: Math.round(DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES / sizes.mb.value),
                minPartitions: 3,
                maxPartitions: 10,
            },
        });
    });
});

describe('alterPartitioningSQL', () => {
    test('generates AUTO_PARTITIONING_BY_SIZE = DISABLED when split-by-size is disabled', () => {
        const query = alterPartitioningSQL('/Root/table', {
            splitBySize: false,
            splitByLoad: true,
            partitionSizeMb: 2048,
            minPartitions: 3,
            maxPartitions: 10,
        });

        expect(query).toContain('AUTO_PARTITIONING_BY_SIZE = DISABLED');
        expect(query).toContain('AUTO_PARTITIONING_BY_LOAD = ENABLED');
    });
});
