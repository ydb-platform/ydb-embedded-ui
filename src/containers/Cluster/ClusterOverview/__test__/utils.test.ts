import {
    calculateBaseDiagramValues,
    getDiagramValues,
} from '../../../../utils/metrics/getDiagramValues';

describe('ClusterOverview utils', () => {
    test('formats metric percentages with one decimal only below one percent', () => {
        expect(calculateBaseDiagramValues({fillWidth: 0.5}).percents).toBe('0.5%');
        expect(calculateBaseDiagramValues({fillWidth: 1}).percents).toBe('1%');
        expect(calculateBaseDiagramValues({fillWidth: 9.9}).percents).toBe('10%');
        expect(calculateBaseDiagramValues({fillWidth: 11}).percents).toBe('11%');
    });

    test('keeps safe fill width alongside normalized fill', () => {
        expect(getDiagramValues({value: 0, capacity: 100})).toMatchObject({
            fill: 0.5,
            isPercentAvailable: true,
            percents: '0%',
            safeFillWidth: 0,
        });

        const unavailableValues = getDiagramValues({value: 10, capacity: 0});

        expect(unavailableValues).toMatchObject({
            fill: 0.5,
            isPercentAvailable: false,
            percents: '0%',
            safeFillWidth: 0,
        });
    });

    test('uses fallback values only when percent is unavailable', () => {
        const fallback = {
            percents: undefined,
            status: 'unavailable' as const,
        };

        expect(getDiagramValues({value: 10, capacity: 0, fallback})).toMatchObject({
            fill: 0.5,
            isPercentAvailable: false,
            percents: undefined,
            safeFillWidth: 0,
            status: 'unavailable',
        });

        expect(getDiagramValues({value: 10, capacity: 100, fallback})).toMatchObject({
            fill: 10,
            isPercentAvailable: true,
            percents: '10%',
            safeFillWidth: 10,
            status: 'good',
        });
    });
});
