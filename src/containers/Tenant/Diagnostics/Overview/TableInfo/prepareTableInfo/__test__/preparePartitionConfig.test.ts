import type {TPartitionConfig} from '../../../../../../../types/api/schema';
import {prepareManagePartitioningDialogConfig} from '../preparePartitionConfig';
import type {PartitionProgressConfig} from '../renderHelpers';

const PROGRESS: PartitionProgressConfig = {
    minPartitions: 4,
    maxPartitions: 100,
    partitionsCount: 4,
};

function getPartitionConfig(sizeToSplit?: string): TPartitionConfig {
    return {
        PartitioningPolicy: sizeToSplit === undefined ? {} : {SizeToSplit: sizeToSplit},
    };
}

describe('prepareManagePartitioningDialogConfig', () => {
    test.each([undefined, '0'])(
        'maps SizeToSplit=%p to disabled size partitioning',
        (sizeToSplit) => {
            const result = prepareManagePartitioningDialogConfig(
                getPartitionConfig(sizeToSplit),
                PROGRESS,
            );

            expect(result).toEqual({
                splitSizeEnabled: false,
                splitSize: '',
                splitUnit: 'gb',
                loadEnabled: false,
                minimum: '4',
                maximum: '100',
            });
        },
    );

    test('maps a positive SizeToSplit to enabled size partitioning', () => {
        const result = prepareManagePartitioningDialogConfig(
            getPartitionConfig('2147483648'),
            PROGRESS,
        );

        expect(result).toEqual({
            splitSizeEnabled: true,
            splitSize: '2',
            splitUnit: 'gb',
            loadEnabled: false,
            minimum: '4',
            maximum: '100',
        });
    });
});
