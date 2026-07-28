import {EFlag} from '../../../types/api/enums';
import {NOT_AVAILABLE_SEVERITY} from '../constants';
import {calculateCompactionSeverity} from '../severityCalculators';

describe('disk severity calculators', () => {
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
});
