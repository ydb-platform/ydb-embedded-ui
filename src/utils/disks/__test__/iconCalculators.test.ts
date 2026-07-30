import {
    CircleCheckFill,
    CircleExclamationFill,
    CircleQuestionFill,
    CircleXmarkFill,
    ClockFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';

import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {EVDiskState} from '../../../types/api/vdisk';
import {
    calculateAllIcon,
    calculateCompactionIcon,
    calculateFrontQueuesIcon,
    calculateSpaceIcon,
} from '../iconCalculators';

describe('disk icon calculators', () => {
    test('returns question icon for missing Space data', () => {
        expect(calculateSpaceIcon({})).toBe(CircleQuestionFill);
    });

    test('returns question icon for missing FrontQueues data', () => {
        expect(calculateFrontQueuesIcon({})).toBe(CircleQuestionFill);
    });

    test('keeps Compaction icon slot for missing Fresh rank', () => {
        expect(
            calculateCompactionIcon({
                SatisfactionRank: {
                    LevelRank: {Flag: EFlag.Yellow},
                },
            }),
        ).toEqual([
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
            {icon: TriangleExclamationFill, color: 'var(--g-color-text-warning)'},
        ]);
    });

    test('keeps Compaction icon slot for missing Level rank', () => {
        expect(
            calculateCompactionIcon({
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Green},
                },
            }),
        ).toEqual([
            {icon: CircleCheckFill, color: 'var(--g-color-text-positive)'},
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
        ]);
    });

    test('returns question icons when both Compaction ranks are missing', () => {
        expect(calculateCompactionIcon({})).toEqual([
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
        ]);
    });

    test('returns question icons when both Compaction ranks are grey', () => {
        expect(
            calculateCompactionIcon({
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Grey},
                    LevelRank: {Flag: EFlag.Grey},
                },
            }),
        ).toEqual([
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
        ]);
    });

    test('returns question and ok icons when one Compaction rank is grey and another is green', () => {
        expect(
            calculateCompactionIcon({
                SatisfactionRank: {
                    FreshRank: {Flag: EFlag.Grey},
                    LevelRank: {Flag: EFlag.Green},
                },
            }),
        ).toEqual([
            {icon: CircleQuestionFill, color: 'rgba(162, 162, 162, 1)'},
            {icon: CircleCheckFill, color: 'var(--g-color-text-positive)'},
        ]);
    });

    test.each([
        {state: EVDiskState.Initial, expected: ClockFill},
        {state: EVDiskState.SyncGuidRecovery, expected: ClockFill},
        {state: EVDiskState.PDiskError, expected: CircleExclamationFill},
        {state: EVDiskState.LocalRecoveryError, expected: CircleXmarkFill},
        {state: EVDiskState.SyncGuidRecoveryError, expected: CircleXmarkFill},
    ])('uses VDiskState icon in All for $state', ({state, expected}) => {
        expect(calculateAllIcon({VDiskState: state})).toBe(expected);
    });

    test('does not add an icon to a healthy All VDisk', () => {
        expect(calculateAllIcon({VDiskState: EVDiskState.OK})).toBeUndefined();
    });

    test('does not use a CapacityAlert abbreviation icon in All', () => {
        expect(
            calculateAllIcon({
                VDiskState: EVDiskState.OK,
                CapacityAlert: ECapacityAlert.LIGHTYELLOW,
            }),
        ).toBeUndefined();
    });
});
