import {EPQPartitionStrategyType} from '../../../../../../types/api/schema';
import type {
    TEvDescribeSchemeResult,
    TPQPartitionStrategy,
} from '../../../../../../types/api/schema';
import {prepareTopicSchemaInfo} from '../prepareTopicSchemaInfo';

const buildDescribe = (partitionStrategy?: TPQPartitionStrategy): TEvDescribeSchemeResult =>
    ({
        PathDescription: {
            PersQueueGroup: {
                Name: 'topic',
                TotalGroupCount: 1,
                Partitions: [{PartitionId: 0}],
                PQTabletConfig: {
                    PartitionConfig: {LifetimeSeconds: 3600},
                    PartitionStrategy: partitionStrategy,
                },
            },
        },
    }) as unknown as TEvDescribeSchemeResult;

describe('prepareTopicSchemaInfo', () => {
    it('shows autopartitioning strategy and bounds when enabled', () => {
        const info = prepareTopicSchemaInfo(
            buildDescribe({
                PartitionStrategyType: EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE,
                MinPartitionCount: 2,
                MaxPartitionCount: 10,
            }),
        );

        expect(info).toEqual(
            expect.arrayContaining([
                {label: 'Autopartitioning', value: 'Up and down'},
                {label: 'Min partitions count', value: '2'},
                {label: 'Max partitions count', value: '10'},
            ]),
        );
    });

    it('shows only the disabled state without bounds when strategy is disabled', () => {
        const info = prepareTopicSchemaInfo(
            buildDescribe({PartitionStrategyType: EPQPartitionStrategyType.DISABLED}),
        );

        expect(info).toEqual(
            expect.arrayContaining([{label: 'Autopartitioning', value: 'Disabled'}]),
        );
        expect(info.find(({label}) => label === 'Min partitions count')).toBeUndefined();
        expect(info.find(({label}) => label === 'Max partitions count')).toBeUndefined();
    });

    it('does not add autopartitioning rows when PartitionStrategy is absent', () => {
        const info = prepareTopicSchemaInfo(buildDescribe());

        expect(info.find(({label}) => label === 'Autopartitioning')).toBeUndefined();
    });
});
