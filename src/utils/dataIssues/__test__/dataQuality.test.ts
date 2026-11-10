import {
    createTableDataQualityReport,
    getResponseDataQuality,
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

describe('getResponseDataQuality', () => {
    test('Should return undefined until there is a response', () => {
        expect(getResponseDataQuality(undefined)).toBeUndefined();
    });

    test('Should fill the defaults for a response without quality fields', () => {
        expect(getResponseDataQuality({})).toEqual(clean);
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
    });
});

describe('createTableDataQualityReport', () => {
    test('Should stamp the report with the receive time and the request it belongs to', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1000);

        const report = createTableDataQualityReport(
            {problems: ['bsc-timeout'], needSort: true},
            {filters: {searchValue: 'a'}, sortParams: {columnId: 'Usage', sortOrder: -1}},
        );

        expect(report).toEqual({
            problems: ['bsc-timeout'],
            needFilter: false,
            needSort: true,
            needGroup: false,
            receivedAt: 1000,
            requestKey: '[{"searchValue":"a"},{"columnId":"Usage","sortOrder":-1}]',
        });

        jest.restoreAllMocks();
    });

    test('Should give different keys to different filters or sorting', () => {
        const base = createTableDataQualityReport({}, {filters: {searchValue: 'a'}});

        expect(createTableDataQualityReport({}, {filters: {searchValue: 'b'}}).requestKey).not.toBe(
            base.requestKey,
        );
        expect(
            createTableDataQualityReport(
                {},
                {filters: {searchValue: 'a'}, sortParams: {columnId: 'Usage'}},
            ).requestKey,
        ).not.toBe(base.requestKey);
    });
});
