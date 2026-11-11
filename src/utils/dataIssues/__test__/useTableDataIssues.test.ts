import {act, renderHook} from '@testing-library/react';

import type {DataIssuesSubject} from '../classify';
import type {ResponseDataQuality, TableDataWithQuality} from '../types';
import {useGroupedTableDataIssues, useTableDataIssues} from '../useTableDataIssues';

const clean: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

function chunkData(quality: Partial<ResponseDataQuality>): TableDataWithQuality<unknown> {
    return {data: [], found: 0, total: 0, dataQuality: {...clean, ...quality}};
}

const STORAGE_GROUPS: DataIssuesSubject = {type: 'storageGroups'};

describe('useTableDataIssues', () => {
    test('Should tell nothing until a chunk reports a problem', () => {
        const {result} = renderHook(() => useTableDataIssues(STORAGE_GROUPS));

        expect(result.current.issues).toEqual([]);
        expect(result.current.problems).toEqual([]);
        expect(result.current.rowsMayBeMissing).toBe(false);
    });

    test('Should classify what the chunks report for the subject of the table', () => {
        const groups = renderHook(() => useTableDataIssues(STORAGE_GROUPS));
        const groupNodes = renderHook(() =>
            // a new object on every render, as the tables pass it
            useTableDataIssues({type: 'nodes', storageNodes: true, hasGroupFilter: true}),
        );
        const report = chunkData({problems: ['bsc-storage-slots-no-data']});

        act(() => groups.result.current.handleChunkDataChange(0, report));
        act(() => groupNodes.result.current.handleChunkDataChange(0, report));

        // The same code means different things for storage groups and for the nodes of a group
        expect(groups.result.current.issues).toEqual(['partial-data']);
        expect(groupNodes.result.current.issues).toEqual(['filter-not-applied']);
        expect(groupNodes.result.current.problems).toEqual(['bsc-storage-slots-no-data']);
    });

    test('Should tell whether rows may be missing because of the issues', () => {
        const {result} = renderHook(() => useTableDataIssues(STORAGE_GROUPS));

        // Unsorted rows are all there
        act(() => result.current.handleChunkDataChange(0, chunkData({needSort: true})));
        expect(result.current.issues).toEqual(['sort-not-applied']);
        expect(result.current.rowsMayBeMissing).toBe(false);

        act(() => result.current.handleChunkDataChange(20, chunkData({problems: ['bsc-timeout']})));
        expect(result.current.issues).toEqual(['list-incomplete', 'sort-not-applied']);
        expect(result.current.rowsMayBeMissing).toBe(true);
    });

    test('Should keep the result while nothing changes', () => {
        const {result, rerender} = renderHook(() => useTableDataIssues({type: 'storageGroups'}));

        act(() => result.current.handleChunkDataChange(0, chunkData({problems: ['bsc-timeout']})));
        const {issues, problems} = result.current;
        rerender();

        expect(result.current.issues).toBe(issues);
        expect(result.current.problems).toBe(problems);
    });
});

describe('useGroupedTableDataIssues', () => {
    const groupsResponse = (quality: Partial<ResponseDataQuality> = {}) => ({
        dataQuality: {...clean, ...quality},
        tableGroups: [{name: 'ssd', count: 2}],
        groups: [],
    });

    test('Should tell nothing for a clean response with groups, or until it is loaded', () => {
        const loading = renderHook(() => useGroupedTableDataIssues(STORAGE_GROUPS, undefined));
        const loaded = renderHook(() =>
            useGroupedTableDataIssues(STORAGE_GROUPS, groupsResponse()),
        );

        expect(loading.result.current.issues).toEqual([]);
        expect(loaded.result.current.issues).toEqual([]);
        expect(loaded.result.current.rowsMayBeMissing).toBe(false);
    });

    test('Should report the problems of the response with the list of groups', () => {
        const {result} = renderHook(() =>
            useGroupedTableDataIssues(
                {type: 'nodes', hasDatabase: true},
                {...groupsResponse({problems: ['hive-timeout']}), groups: undefined, nodes: []},
            ),
        );

        expect(result.current.issues).toEqual(['list-incomplete']);
        expect(result.current.problems).toEqual(['hive-timeout']);
        expect(result.current.rowsMayBeMissing).toBe(true);
    });

    test('Should add what the tables of expanded groups report', () => {
        const response = groupsResponse({problems: ['hive-timeout']});
        const {result} = renderHook(() => useGroupedTableDataIssues(STORAGE_GROUPS, response));
        const reportSsd = result.current.getGroupChunkDataChangeHandler('ssd');

        act(() => reportSsd(0, chunkData({problems: ['bsc-timeout'], needSort: true})));

        expect(result.current.issues).toEqual([
            'list-incomplete',
            'sort-not-applied',
            'partial-data',
        ]);
        expect(result.current.problems).toEqual(['hive-timeout', 'bsc-timeout']);

        // The group is collapsed: its table is unmounted and the chunk reports that it is gone
        act(() => reportSsd(0, undefined));

        expect(result.current.issues).toEqual(['partial-data']);
    });

    test('Should give every group one handler for all renders', () => {
        const {result, rerender} = renderHook(() =>
            useGroupedTableDataIssues(STORAGE_GROUPS, groupsResponse()),
        );
        const reportSsd = result.current.getGroupChunkDataChangeHandler('ssd');
        rerender();

        expect(result.current.getGroupChunkDataChangeHandler('ssd')).toBe(reportSsd);
        expect(result.current.getGroupChunkDataChangeHandler('hdd')).not.toBe(reportSsd);
    });

    test.each([
        ['storage groups', {groups: [{GroupId: '1'}]}],
        ['nodes', {nodes: [{NodeId: 1}]}],
    ])('Should take a plain list of %s for grouping that was not applied', (_name, rows) => {
        // The handler returned the rows instead of the groups and did not raise NeedGroup
        const {result} = renderHook(() =>
            useGroupedTableDataIssues(STORAGE_GROUPS, {dataQuality: clean, ...rows}),
        );

        expect(result.current.issues).toEqual(['group-not-applied']);
        expect(result.current.rowsMayBeMissing).toBe(false);
    });

    test('Should not take an empty response for grouping that was not applied', () => {
        const {result} = renderHook(() =>
            useGroupedTableDataIssues(STORAGE_GROUPS, {dataQuality: clean, groups: [], nodes: []}),
        );

        expect(result.current.issues).toEqual([]);
    });
});
