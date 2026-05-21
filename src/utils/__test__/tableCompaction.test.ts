import {CompactState, OPERATION_METADATA_TYPE_URLS} from '../../types/api/operations';
import {
    createTableCompactionQuery,
    findRunningTableCompactionOperation,
    getCompactionProgress,
    getCompactionShardProgress,
    isForcedCompactionEnabled,
} from '../tableCompaction';

describe('tableCompaction utils', () => {
    test('detects enabled forced compaction feature flag', () => {
        expect(
            isForcedCompactionEnabled([
                {Name: 'SomeOtherFlag', Default: true},
                {Name: 'EnableForcedCompactions', Default: false, Current: true},
            ]),
        ).toBe(true);

        expect(isForcedCompactionEnabled([{Name: 'EnableForcedCompactions', Default: true}])).toBe(
            true,
        );

        expect(
            isForcedCompactionEnabled([
                {Name: 'EnableForcedCompactions', Default: true, Current: false},
            ]),
        ).toBe(false);
    });

    test('builds compaction SQL with escaped table path and selected options', () => {
        expect(
            createTableCompactionQuery('folder/table`name', {
                cascade: false,
                maxShardsInFlight: 3,
            }),
        ).toBe(
            '/*UI-QUERY-EXCLUDE*/\nALTER TABLE `folder/table``name` COMPACT WITH (CASCADE = false, MAX_SHARDS_IN_FLIGHT = 3)',
        );
    });

    test('finds a running compaction for the selected table path', () => {
        const runningOperation = {
            ready: false,
            metadata: {
                '@type': OPERATION_METADATA_TYPE_URLS.Compact,
                path: '/Root/db/table',
                state: CompactState.STATE_IN_PROGRESS,
                progress: 51.4,
                shards_done: 2,
                shards_total: 4,
            },
        };

        const foundOperation = findRunningTableCompactionOperation(
            [
                {
                    ready: false,
                    metadata: {
                        '@type': OPERATION_METADATA_TYPE_URLS.Compact,
                        path: '/Root/db/other',
                        state: CompactState.STATE_IN_PROGRESS,
                    },
                },
                runningOperation,
                {
                    ready: true,
                    metadata: {
                        '@type': OPERATION_METADATA_TYPE_URLS.Compact,
                        path: '/Root/db/table',
                        state: CompactState.STATE_DONE,
                    },
                },
            ],
            '/Root/db/table',
        );

        expect(foundOperation).toBe(runningOperation);
        expect(getCompactionProgress(foundOperation)).toBe(51);
        expect(getCompactionShardProgress(foundOperation)).toEqual({
            shardsDone: 2,
            shardsTotal: 4,
        });
    });
});
