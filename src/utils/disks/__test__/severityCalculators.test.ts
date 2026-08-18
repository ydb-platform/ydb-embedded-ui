import {EFlag} from '../../../types/api/enums';
import {EVDiskState} from '../../../types/api/vdisk';
import {
    COMPACTION_SEVERITY,
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    SOLID_RED_SEVERITY,
} from '../constants';
import {
    calculateAllSeverity,
    calculateCompactionSeverity,
    calculateFlagPairSeverity,
} from '../severityCalculators';

describe('disk severity calculators', () => {
    test.each([
        [EFlag.Green, EFlag.Green, COMPACTION_SEVERITY.OK],
        [EFlag.Blue, EFlag.Green, COMPACTION_SEVERITY.OK],
        [EFlag.Green, EFlag.Blue, COMPACTION_SEVERITY.OK],
        [EFlag.Blue, EFlag.Blue, COMPACTION_SEVERITY.OK],
        [undefined, EFlag.Green, NOT_AVAILABLE_SEVERITY],
        [EFlag.Grey, EFlag.Green, NOT_AVAILABLE_SEVERITY],
        [undefined, EFlag.Yellow, COMPACTION_SEVERITY.NOTICE],
        [EFlag.Grey, EFlag.Yellow, COMPACTION_SEVERITY.NOTICE],
        [undefined, EFlag.Red, COMPACTION_SEVERITY.WARNING],
    ])('orders pair severity for %s and %s', (firstFlag, secondFlag, expectedSeverity) => {
        expect(calculateFlagPairSeverity(firstFlag, secondFlag)).toBe(expectedSeverity);
    });

    test('returns not available severity when both Compaction ranks are grey', () => {
        expect(
            calculateCompactionSeverity({
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Grey},
                    LevelRank: {Flag: EFlag.Grey},
                },
            }),
        ).toBe(NOT_AVAILABLE_SEVERITY);
    });

    test('returns not available severity when one Compaction rank is grey and another is green', () => {
        expect(
            calculateCompactionSeverity({
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Grey},
                    LevelRank: {Flag: EFlag.Green},
                },
            }),
        ).toBe(NOT_AVAILABLE_SEVERITY);
    });

    test.each([
        {
            name: 'OK',
            vDisk: {
                VDiskState: EVDiskState.OK,
                Severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
                FrontQueues: EFlag.Red,
            },
            expected: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
        },
        {
            name: 'Initial',
            vDisk: {
                VDiskState: EVDiskState.Initial,
                Severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
            },
            expected: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        },
        {
            name: 'SyncGuidRecovery',
            vDisk: {VDiskState: EVDiskState.SyncGuidRecovery},
            expected: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
        },
        {
            name: 'PDiskError',
            vDisk: {VDiskState: EVDiskState.PDiskError},
            expected: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
        },
        {
            name: 'VDisk recovery error',
            vDisk: {VDiskState: EVDiskState.LocalRecoveryError},
            expected: SOLID_RED_SEVERITY,
        },
        {
            name: 'SyncGuidRecoveryError',
            vDisk: {VDiskState: EVDiskState.SyncGuidRecoveryError},
            expected: SOLID_RED_SEVERITY,
        },
    ])('uses VDiskState for All severity: $name', ({vDisk, expected}) => {
        expect(calculateAllSeverity(vDisk)).toBe(expected);
    });

    test('keeps a healthy replicating All VDisk blue', () => {
        expect(
            calculateAllSeverity({
                VDiskState: EVDiskState.OK,
                Replicated: false,
                Severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green,
            }),
        ).toBe(DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue);
    });
});
