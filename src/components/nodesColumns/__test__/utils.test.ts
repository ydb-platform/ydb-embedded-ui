import {UNBREAKABLE_GAP} from '../../../utils/utils';
import {prepareClockSkewValue, preparePingTimeValue} from '../utils';

describe('preparePingTimeValue', () => {
    it('Should correctly prepare value', () => {
        expect(preparePingTimeValue(1)).toEqual(`0${UNBREAKABLE_GAP}ms`);
        expect(preparePingTimeValue(100)).toEqual(`0.1${UNBREAKABLE_GAP}ms`);
        expect(preparePingTimeValue(5_550)).toEqual(`6${UNBREAKABLE_GAP}ms`);
        expect(preparePingTimeValue(100_000)).toEqual(`100${UNBREAKABLE_GAP}ms`);
    });
});

describe('prepareClockSkewValue', () => {
    it('Should correctly prepare 0 or very low values', () => {
        expect(prepareClockSkewValue(0)).toEqual(`0${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(10)).toEqual(`0${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(-10)).toEqual(`0${UNBREAKABLE_GAP}ms`);
    });
    it('Should correctly prepare positive values', () => {
        expect(prepareClockSkewValue(100)).toEqual(`+0.1${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(5_500)).toEqual(`+6${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(100_000)).toEqual(`+100${UNBREAKABLE_GAP}ms`);
    });

    it('Should correctly prepare negative values', () => {
        expect(prepareClockSkewValue(-100)).toEqual(`-0.1${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(-5_500)).toEqual(`-6${UNBREAKABLE_GAP}ms`);
        expect(prepareClockSkewValue(-100_000)).toEqual(`-100${UNBREAKABLE_GAP}ms`);
    });
});
