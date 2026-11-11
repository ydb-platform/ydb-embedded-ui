import {act, renderHook} from '@testing-library/react';

import type {ResponseDataQuality, TableDataWithQuality} from '../types';
import {useTableDataQuality} from '../useTableDataQuality';

const clean: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

function chunkData(quality?: Partial<ResponseDataQuality>): TableDataWithQuality<unknown> {
    return {
        data: [],
        found: 0,
        total: 0,
        dataQuality: quality ? {...clean, ...quality} : undefined,
    };
}

const withProblem = (problem: string) => chunkData({problems: [problem]});

describe('useTableDataQuality', () => {
    test('Should have no report until a chunk has something to tell', () => {
        const {result} = renderHook(() => useTableDataQuality());

        expect(result.current.dataQuality).toBeUndefined();

        // Loaded without problems, loaded by a fetcher that reports nothing, not loaded at all
        act(() => result.current.handleChunkDataChange(0, chunkData({})));
        act(() => result.current.handleChunkDataChange(20, chunkData()));
        act(() => result.current.handleChunkDataChange(40, undefined));

        expect(result.current.dataQuality).toBeUndefined();
        expect(result.current.dataQualityBySource).toEqual({});
    });

    test('Should keep the problems of a chunk whatever the other chunks report', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        // Clean neighbours arrive later: they say nothing about the rows of the first chunk
        act(() => result.current.handleChunkDataChange(20, chunkData({})));
        act(() => result.current.handleChunkDataChange(40, chunkData({})));

        expect(result.current.dataQuality).toEqual({...clean, problems: ['bsc-timeout']});
    });

    test('Should not depend on the order the chunks report in', () => {
        const first = renderHook(() => useTableDataQuality());
        const second = renderHook(() => useTableDataQuality());

        act(() => {
            first.result.current.handleChunkDataChange(100, withProblem('bsc-timeout'));
            first.result.current.handleChunkDataChange(0, chunkData({needSort: true}));
            first.result.current.handleChunkDataChange(20, chunkData({}));
        });
        act(() => {
            second.result.current.handleChunkDataChange(20, chunkData({}));
            second.result.current.handleChunkDataChange(0, chunkData({needSort: true}));
            second.result.current.handleChunkDataChange(100, withProblem('bsc-timeout'));
        });

        const expected = {...clean, problems: ['bsc-timeout'], needSort: true};
        expect(first.result.current.dataQuality).toEqual(expected);
        expect(second.result.current.dataQuality).toEqual(expected);
    });

    test('Should unite the problems of all chunks without repeating them', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        act(() =>
            result.current.handleChunkDataChange(
                20,
                chunkData({problems: ['bsc-timeout', 'hive-timeout'], needFilter: true}),
            ),
        );

        expect(result.current.dataQuality).toEqual({
            ...clean,
            problems: ['bsc-timeout', 'hive-timeout'],
            needFilter: true,
        });
    });

    test('Should drop the problems of a chunk reloaded without them', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        act(() => result.current.handleChunkDataChange(20, withProblem('hive-timeout')));
        act(() => result.current.handleChunkDataChange(0, chunkData({})));

        expect(result.current.dataQuality).toEqual({...clean, problems: ['hive-timeout']});

        act(() => result.current.handleChunkDataChange(20, chunkData({})));

        expect(result.current.dataQuality).toBeUndefined();
    });

    test('Should drop the problems of a chunk that holds no data any more', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        // New filters or sorting, or the chunk is no longer rendered
        act(() => result.current.handleChunkDataChange(0, undefined));

        expect(result.current.dataQuality).toBeUndefined();
    });

    test('Should keep the state when a chunk repeats its report', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        const {dataQuality, dataQualityBySource} = result.current;

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        act(() => result.current.handleChunkDataChange(20, chunkData({})));
        act(() => result.current.handleChunkDataChange(40, undefined));

        expect(result.current.dataQuality).toBe(dataQuality);
        expect(result.current.dataQualityBySource).toBe(dataQualityBySource);
    });

    test('Should keep the reports of several tables apart', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout'), 'ssd'));
        act(() => result.current.handleChunkDataChange(0, withProblem('hive-timeout'), 'hdd'));

        expect(result.current.dataQuality).toBeUndefined();
        expect(result.current.dataQualityBySource).toEqual({
            ssd: {...clean, problems: ['bsc-timeout']},
            hdd: {...clean, problems: ['hive-timeout']},
        });

        // The table of a collapsed group is unmounted and its chunks report that they are gone
        act(() => result.current.handleChunkDataChange(0, undefined, 'ssd'));

        expect(result.current.dataQualityBySource).toEqual({
            hdd: {...clean, problems: ['hive-timeout']},
        });
    });

    test('Should keep the callback stable', () => {
        const {result, rerender} = renderHook(() => useTableDataQuality());
        const {handleChunkDataChange} = result.current;

        act(() => handleChunkDataChange(0, withProblem('bsc-timeout')));
        rerender();

        expect(result.current.handleChunkDataChange).toBe(handleChunkDataChange);
    });
});
