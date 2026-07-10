import {calculateBaseDiagramValues, getDiagramValues} from '../getDiagramValues';

describe('getDiagramValues', () => {
    test('formats metric percentages with one decimal only below one percent', () => {
        expect(calculateBaseDiagramValues({fillWidth: 0.5}).percents).toBe('0.5%');
        expect(calculateBaseDiagramValues({fillWidth: 1}).percents).toBe('1%');
        expect(calculateBaseDiagramValues({fillWidth: 1.5}).percents).toBe('2%');
        expect(calculateBaseDiagramValues({fillWidth: 9.9}).percents).toBe('10%');
        expect(calculateBaseDiagramValues({fillWidth: 11}).percents).toBe('11%');
    });

    test('rounds progress value consistently with percent text', () => {
        expect(calculateBaseDiagramValues({fillWidth: 0.575 * 100})).toMatchObject({
            percents: '58%',
            progressValue: 58,
        });
    });

    test('clamps progress value without clamping percent text', () => {
        expect(calculateBaseDiagramValues({fillWidth: 213.5})).toMatchObject({
            percents: '214%',
            progressValue: 100,
        });
    });

    test('keeps progress value alongside normalized fill', () => {
        expect(getDiagramValues({value: 0, capacity: 100})).toMatchObject({
            fill: 0.5,
            percents: '0%',
            progressValue: 0,
        });

        expect(getDiagramValues({value: 10, capacity: 0})).toMatchObject({
            fill: 0.5,
            percents: '0%',
            progressValue: 0,
        });
    });

    test('uses fallback values only when percent is unavailable', () => {
        const fallback = {
            percents: undefined,
            status: 'unavailable' as const,
        };

        expect(getDiagramValues({value: 10, capacity: 0, fallback})).toMatchObject({
            fill: 0.5,
            percents: undefined,
            progressValue: 0,
            status: 'unavailable',
        });

        expect(getDiagramValues({value: 10, capacity: 100, fallback})).toMatchObject({
            fill: 10,
            percents: '10%',
            progressValue: 10,
            status: 'good',
        });
    });
});
