import {CircleCheckFill, CircleQuestionFill, TriangleExclamationFill} from '@gravity-ui/icons';

import {EFlag} from '../../../types/api/enums';
import {
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
});
