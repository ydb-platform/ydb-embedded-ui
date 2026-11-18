import {
    isCleanDataQuality,
    isSameDataQuality,
    mergeDataQuality,
    prepareResponseDataQuality,
} from '../dataQuality';
import type {ResponseDataQuality} from '../types';

const clean: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

describe('prepareResponseDataQuality', () => {
    test('Should treat absent fields of older backends as nothing to report', () => {
        expect(prepareResponseDataQuality({})).toEqual(clean);
    });

    test('Should keep unique string codes only and accept only boolean flags', () => {
        expect(
            prepareResponseDataQuality({
                Problems: ['bsc-error', 1, undefined, 'bsc-error', {}, 'hive-timeout'],
                NeedFilter: true,
                NeedSort: 1,
                NeedGroup: 'true',
            }),
        ).toEqual({
            problems: ['bsc-error', 'hive-timeout'],
            needFilter: true,
            needSort: false,
            needGroup: false,
        });
    });
});

describe('mergeDataQuality', () => {
    test('Should return undefined when nothing was reported yet', () => {
        expect(mergeDataQuality([undefined, undefined])).toBeUndefined();
    });

    test('Should unite problems and flags of all reports', () => {
        expect(
            mergeDataQuality([
                {...clean, problems: ['bsc-timeout'], needGroup: true},
                undefined,
                {...clean, problems: ['wb-incomplete', 'bsc-timeout'], needSort: true},
            ]),
        ).toEqual({
            problems: ['bsc-timeout', 'wb-incomplete'],
            needFilter: false,
            needSort: true,
            needGroup: true,
        });
    });
});

describe('isSameDataQuality', () => {
    test('Should compare flags and problem codes', () => {
        expect(isSameDataQuality(clean, {...clean})).toBe(true);
        expect(isSameDataQuality(clean, {...clean, needSort: true})).toBe(false);
        expect(isSameDataQuality(clean, {...clean, problems: ['bsc-error']})).toBe(false);
        expect(
            isSameDataQuality(
                {...clean, problems: ['bsc-error']},
                {...clean, problems: ['bsc-error']},
            ),
        ).toBe(true);
        expect(
            isSameDataQuality(
                {...clean, problems: ['bsc-error']},
                {...clean, problems: ['bsc-timeout']},
            ),
        ).toBe(false);
    });

    test('Should not depend on the order of the problem codes', () => {
        expect(
            isSameDataQuality(
                {...clean, problems: ['bsc-error', 'hive-timeout']},
                {...clean, problems: ['hive-timeout', 'bsc-error']},
            ),
        ).toBe(true);
    });

    test('Should tell a report from no report', () => {
        expect(isSameDataQuality(undefined, undefined)).toBe(true);
        expect(isSameDataQuality(clean, undefined)).toBe(false);
        expect(isSameDataQuality(undefined, clean)).toBe(false);
    });
});

describe('isCleanDataQuality', () => {
    test('Should tell a response with nothing to report from the others', () => {
        expect(isCleanDataQuality(clean)).toBe(true);
        expect(isCleanDataQuality({...clean, problems: ['bsc-error']})).toBe(false);
        expect(isCleanDataQuality({...clean, needFilter: true})).toBe(false);
        expect(isCleanDataQuality({...clean, needSort: true})).toBe(false);
        expect(isCleanDataQuality({...clean, needGroup: true})).toBe(false);
    });
});
