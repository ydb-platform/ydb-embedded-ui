import {EPQPartitionStrategyType} from '../../../../../../types/api/schema';
import type {
    TEvDescribeSchemeResult,
    TPQPartitionConfig,
    TPQPartitionStrategy,
} from '../../../../../../types/api/schema';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../../utils/constants';
import {prepareTopicSchemaInfo} from '../prepareTopicSchemaInfo';

const buildDescribe = (
    partitionStrategy?: TPQPartitionStrategy,
    partitionConfig: Partial<TPQPartitionConfig> = {LifetimeSeconds: 3600},
): TEvDescribeSchemeResult =>
    ({
        PathDescription: {
            PersQueueGroup: {
                Name: 'topic',
                TotalGroupCount: 1,
                Partitions: [{PartitionId: 0}],
                PQTabletConfig: {
                    PartitionConfig: partitionConfig,
                    PartitionStrategy: partitionStrategy,
                },
            },
        },
    }) as unknown as TEvDescribeSchemeResult;

describe('prepareTopicSchemaInfo', () => {
    it('keeps the partition count and shows a retention placeholder without PQTabletConfig', () => {
        const data = buildDescribe();
        delete data.PathDescription?.PersQueueGroup?.PQTabletConfig;

        expect(prepareTopicSchemaInfo(data)).toEqual([
            {label: 'Partitions count', value: '1'},
            {label: 'Retention', value: EMPTY_DATA_PLACEHOLDER},
        ]);
    });

    it('keeps partitioning and autopartitioning rows without PartitionConfig', () => {
        const data = buildDescribe({
            PartitionStrategyType: EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE,
            MinPartitionCount: 2,
            MaxPartitionCount: 10,
        });
        delete data.PathDescription?.PersQueueGroup?.PQTabletConfig?.PartitionConfig;

        expect(prepareTopicSchemaInfo(data)).toEqual([
            {label: 'Partitions count', value: '1'},
            {label: 'Retention', value: EMPTY_DATA_PLACEHOLDER},
            {label: 'Autopartitioning', value: 'Up and down'},
            {label: 'Min partitions count', value: '2'},
            {label: 'Max partitions count', value: '10'},
        ]);
    });

    it.each([undefined, NaN, Infinity, -Infinity])(
        'keeps available topic settings and shows a placeholder when retention is %s',
        (lifetimeSeconds) => {
            const data = buildDescribe(
                {
                    PartitionStrategyType: EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE,
                    MinPartitionCount: 2,
                    MaxPartitionCount: 10,
                },
                {
                    LifetimeSeconds: lifetimeSeconds,
                    StorageLimitBytes: '2000000',
                    WriteSpeedInBytesPerSecond: '1000000',
                },
            );

            expect(prepareTopicSchemaInfo(data)).toEqual(
                expect.arrayContaining([
                    {label: 'Partitions count', value: '1'},
                    {label: 'Retention', value: EMPTY_DATA_PLACEHOLDER},
                    {label: 'Retention storage', value: '2 MB'},
                    {label: 'Partitions write speed', value: '1 MB/s'},
                    {label: 'Autopartitioning', value: 'Up and down'},
                    {label: 'Min partitions count', value: '2'},
                    {label: 'Max partitions count', value: '10'},
                ]),
            );
        },
    );

    it('renders zero retention as a value instead of a placeholder', () => {
        const info = prepareTopicSchemaInfo(buildDescribe(undefined, {LifetimeSeconds: 0}));

        expect(info).toEqual(expect.arrayContaining([{label: 'Retention', value: '0 hours'}]));
    });

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

    it('keeps the autopartitioning row for an unknown strategy from a newer backend', () => {
        const info = prepareTopicSchemaInfo(
            buildDescribe({
                PartitionStrategyType: 'SOME_FUTURE_STRATEGY' as EPQPartitionStrategyType,
                MinPartitionCount: 2,
                MaxPartitionCount: 10,
            }),
        );

        expect(info).toEqual(
            expect.arrayContaining([{label: 'Autopartitioning', value: 'SOME_FUTURE_STRATEGY'}]),
        );
    });

    it('renders the placeholder for a bound the API did not supply', () => {
        const info = prepareTopicSchemaInfo(
            buildDescribe({
                PartitionStrategyType: EPQPartitionStrategyType.CAN_SPLIT_AND_MERGE,
                MinPartitionCount: 2,
            }),
        );

        expect(info).toEqual(
            expect.arrayContaining([
                {label: 'Min partitions count', value: '2'},
                {label: 'Max partitions count', value: EMPTY_DATA_PLACEHOLDER},
            ]),
        );
    });
});
