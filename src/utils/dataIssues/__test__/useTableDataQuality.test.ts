import React from 'react';

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
        meta: quality ? {dataQuality: {...clean, ...quality}} : undefined,
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
    });

    test('Should keep the problems of a chunk whatever the other chunks report', () => {
        const {result} = renderHook(() => useTableDataQuality());

        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        // Clean neighbours arrive later: they say nothing about the rows of the first chunk
        act(() => result.current.handleChunkDataChange(20, chunkData({})));
        act(() => result.current.handleChunkDataChange(40, chunkData({})));

        expect(result.current.dataQuality).toEqual({...clean, problems: ['bsc-timeout']});
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

    test('Should publish one change for many chunks that report the same problem', () => {
        let renders = 0;
        const {result} = renderHook(() => {
            renders += 1;
            return useTableDataQuality();
        });
        const rendersBefore = renders;

        // A degraded table: every chunk that gets rendered while it is scrolled has the same problem
        act(() => result.current.handleChunkDataChange(0, withProblem('bsc-timeout')));
        const {dataQuality} = result.current;
        act(() => result.current.handleChunkDataChange(20, withProblem('bsc-timeout')));
        act(() => result.current.handleChunkDataChange(40, withProblem('bsc-timeout')));
        act(() => result.current.handleChunkDataChange(0, undefined));
        act(() => result.current.handleChunkDataChange(60, withProblem('bsc-timeout')));
        act(() => result.current.handleChunkDataChange(20, undefined));

        expect(renders).toBe(rendersBefore + 1);
        expect(result.current.dataQuality).toBe(dataQuality);

        // The last chunks with the problem leave: this is the second and the last change
        act(() => result.current.handleChunkDataChange(40, undefined));
        act(() => result.current.handleChunkDataChange(60, undefined));

        expect(renders).toBe(rendersBefore + 2);
        expect(result.current.dataQuality).toBeUndefined();
    });

    test('Should unite the reports of several tables and tell their chunks apart', () => {
        const {result} = renderHook(() => useTableDataQuality());
        const reportSsd = result.current.getChunkDataChangeHandler('ssd');
        const reportHdd = result.current.getChunkDataChangeHandler('hdd');

        // The same chunk offset in the tables of two expanded groups
        act(() => reportSsd(0, withProblem('bsc-timeout')));
        act(() => reportHdd(0, withProblem('hive-timeout')));

        expect(result.current.dataQuality).toEqual({
            ...clean,
            problems: ['bsc-timeout', 'hive-timeout'],
        });

        // The table of a collapsed group is unmounted and its chunks report that they are gone
        act(() => reportSsd(0, undefined));

        expect(result.current.dataQuality).toEqual({...clean, problems: ['hive-timeout']});
    });

    test('Should keep the handlers stable, also in strict mode', () => {
        const {result, rerender} = renderHook(() => useTableDataQuality(), {
            wrapper: React.StrictMode,
        });
        const {handleChunkDataChange, getChunkDataChangeHandler} = result.current;
        const reportSsd = getChunkDataChangeHandler('ssd');

        act(() => handleChunkDataChange(0, withProblem('bsc-timeout')));
        rerender();

        expect(result.current.handleChunkDataChange).toBe(handleChunkDataChange);
        expect(result.current.getChunkDataChangeHandler('ssd')).toBe(reportSsd);
        expect(result.current.dataQuality).toEqual({...clean, problems: ['bsc-timeout']});
    });
});
