import {EFlag} from '../../../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {
    calculateUsagePercent,
    getMetricPageSummaryPresentation,
    getMetricTabPresentation,
} from '../metricPresentation';

describe('metric presentation', () => {
    test('formats unavailable tab metrics with the tab placeholder', () => {
        expect(getMetricTabPresentation({usagePercent: NaN})).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });

        expect(getMetricTabPresentation({usagePercent: calculateUsagePercent(10, 0)})).toEqual({
            percentText: 'N/A',
            status: EFlag.Grey,
        });
    });

    test('formats usage summary metrics with value text and progress theme', () => {
        expect(
            getMetricPageSummaryPresentation({
                usagePercent: (68 / 87) * 100,
                valueText: '68 of 87 cores',
            }),
        ).toEqual({
            percentText: '78%',
            progressTheme: 'success',
            progressValue: 78,
            valueText: '68 of 87 cores',
        });
    });

    test('formats unavailable summary metrics with the shared empty placeholder', () => {
        expect(
            getMetricPageSummaryPresentation({
                usagePercent: NaN,
                valueText: '10 of 0',
            }),
        ).toEqual({
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText: '10 of 0',
        });
    });

    test('formats utilization summary metrics from usage percent', () => {
        expect(getMetricPageSummaryPresentation({usagePercent: 96})).toEqual({
            percentText: '96%',
            progressTheme: 'danger',
            progressValue: 96,
            valueText: undefined,
        });
    });

    test('keeps fractional progress for usage below one percent', () => {
        expect(getMetricPageSummaryPresentation({usagePercent: 0.5})).toEqual({
            percentText: '0.5%',
            progressTheme: 'success',
            progressValue: 0.5,
            valueText: undefined,
        });
    });
});
