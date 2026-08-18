import {CircleQuestionFill} from '@gravity-ui/icons';

import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY, DONOR_COLOR} from '../constants';
import {getDiskBarTone} from '../getDiskBarTone';

describe('getDiskBarTone', () => {
    test('uses donor tone regardless of severity and indicator', () => {
        expect(
            getDiskBarTone({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red,
                isDonor: true,
                showIndicator: true,
                indicator: CircleQuestionFill,
            }),
        ).toBe(DONOR_COLOR);
    });

    test('uses light grey only when a missing-data indicator is visible', () => {
        expect(
            getDiskBarTone({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                showIndicator: true,
                indicator: CircleQuestionFill,
            }),
        ).toBe('LightGrey');
        expect(
            getDiskBarTone({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                showIndicator: false,
                indicator: CircleQuestionFill,
            }),
        ).toBe('Grey');
    });

    test('detects a missing-data indicator inside an icon group', () => {
        expect(
            getDiskBarTone({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey,
                showIndicator: true,
                indicator: [{icon: CircleQuestionFill}],
            }),
        ).toBe('LightGrey');
    });

    test('maps ordinary severity to its display tone', () => {
        expect(
            getDiskBarTone({
                severity: DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow,
                showIndicator: true,
            }),
        ).toBe('Yellow');
    });
});
