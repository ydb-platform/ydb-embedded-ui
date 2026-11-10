import {act, renderHook} from '@testing-library/react';

import type {ResponseDataQuality, TableDataWithQuality} from '../types';
import {useTableDataQuality} from '../useTableDataQuality';

const clean: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

function tableData(
    receivedAt: number,
    quality: Partial<ResponseDataQuality> = {},
    requestKey = 'request-1',
): TableDataWithQuality<unknown> {
    return {
        data: [],
        found: 0,
        total: 0,
        dataQuality: {...clean, ...quality, receivedAt, requestKey},
    };
}

describe('useTableDataQuality', () => {
    test('Should have no report until the table receives data', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        expect(result.current.dataQuality).toBeUndefined();
        expect(result.current.dataQualityBySource).toEqual({});
    });

    test('Should ignore data without a quality report', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() => result.current.handleDataFetched({data: [], found: 0, total: 0}));

        expect(result.current.dataQuality).toBeUndefined();
    });

    test('Should keep the most recently received response of one request', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() => result.current.handleDataFetched(tableData(200, {problems: ['bsc-timeout']})));
        // A chunk that still holds an older response reports after a newer one
        act(() => result.current.handleDataFetched(tableData(100)));

        expect(result.current.dataQuality).toEqual({...clean, problems: ['bsc-timeout']});

        act(() => result.current.handleDataFetched(tableData(300)));

        expect(result.current.dataQuality).toEqual(clean);
    });

    test('Should not go back to an older response after equal reports', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() => result.current.handleDataFetched(tableData(100)));
        act(() => result.current.handleDataFetched(tableData(300)));
        act(() => result.current.handleDataFetched(tableData(200, {needSort: true})));

        expect(result.current.dataQuality).toEqual(clean);
    });

    test('Should show the report of another request even if it was received earlier', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() => result.current.handleDataFetched(tableData(200, {}, 'sorted-by-id')));
        // The user returns to a sorting whose chunks are still cached
        act(() =>
            result.current.handleDataFetched(tableData(100, {needSort: true}, 'sorted-by-type')),
        );

        expect(result.current.dataQuality).toEqual({...clean, needSort: true});
    });

    test('Should keep the state when a repeated report changes nothing', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() => result.current.handleDataFetched(tableData(100, {problems: ['bsc-timeout']})));
        const firstReports = result.current.dataQualityBySource;
        act(() => result.current.handleDataFetched(tableData(200, {problems: ['bsc-timeout']})));

        expect(result.current.dataQualityBySource).toBe(firstReports);
    });

    test('Should drop the reports when the scope changes', () => {
        const {result, rerender} = renderHook(({scopeKey}) => useTableDataQuality(scopeKey), {
            initialProps: {scopeKey: 'search-a'},
        });

        act(() => result.current.handleDataFetched(tableData(100, {problems: ['bsc-timeout']})));
        expect(result.current.dataQuality).toEqual({...clean, problems: ['bsc-timeout']});

        rerender({scopeKey: 'search-b'});
        expect(result.current.dataQuality).toBeUndefined();

        // An earlier response is accepted: it belongs to the new scope
        act(() => result.current.handleDataFetched(tableData(50, {needFilter: true})));
        expect(result.current.dataQuality).toEqual({...clean, needFilter: true});

        rerender({scopeKey: 'search-a'});
        expect(result.current.dataQuality).toBeUndefined();
    });

    test('Should keep reports of several sources separately', () => {
        const {result} = renderHook(() => useTableDataQuality('scope'));

        act(() =>
            result.current.handleDataFetched(tableData(100, {problems: ['bsc-timeout']}), 'ssd'),
        );
        act(() => result.current.handleDataFetched(tableData(50, {needSort: true}), 'hdd'));

        expect(result.current.dataQuality).toBeUndefined();
        expect(result.current.dataQualityBySource).toEqual({
            ssd: {...clean, problems: ['bsc-timeout']},
            hdd: {...clean, needSort: true},
        });
    });
});
