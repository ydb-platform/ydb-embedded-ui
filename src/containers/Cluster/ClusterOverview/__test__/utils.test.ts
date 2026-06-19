import {calculateBaseDiagramValues} from '../utils';

describe('ClusterOverview utils', () => {
    test('formats metric percentages with one decimal only below one percent', () => {
        expect(calculateBaseDiagramValues({fillWidth: 0.5}).percents).toBe('0.5%');
        expect(calculateBaseDiagramValues({fillWidth: 1}).percents).toBe('1%');
        expect(calculateBaseDiagramValues({fillWidth: 9.9}).percents).toBe('10%');
        expect(calculateBaseDiagramValues({fillWidth: 11}).percents).toBe('11%');
    });
});
