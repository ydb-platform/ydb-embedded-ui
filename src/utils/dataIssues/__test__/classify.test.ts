import {getNodesDataIssues, getStorageGroupsDataIssues} from '../classify';
import type {DataIssueKind, NodesDataIssuesContext} from '../classify';
import type {ResponseDataQuality} from '../types';

function quality(
    problems: string[] = [],
    flags: Partial<Omit<ResponseDataQuality, 'problems'>> = {},
): ResponseDataQuality {
    return {problems, needFilter: false, needSort: false, needGroup: false, ...flags};
}

describe('getStorageGroupsDataIssues', () => {
    test('Should report nothing without a response or for a clean response', () => {
        expect(getStorageGroupsDataIssues(undefined)).toEqual([]);
        expect(getStorageGroupsDataIssues(quality())).toEqual([]);
    });

    test.each<[string, DataIssueKind]>([
        ['bsc-error', 'list-incomplete'],
        ['bsc-timeout', 'list-incomplete'],
        ['bsc-incomplete', 'list-incomplete'],
        ['bsc-storage-groups-no-data', 'list-incomplete'],
        ['wb-incomplete-groups', 'list-incomplete'],
        ['bsc-storage-pools-no-data', 'partial-data'],
        ['bsc-vslots-no-data', 'partial-data'],
        ['bsc-wrong-data', 'partial-data'],
        ['bsc-pdisks-no-data', 'partial-data'],
        ['wb-incomplete-disks', 'partial-data'],
        ['hive-timeout', 'partial-data'],
        ['hive-incomplete', 'partial-data'],
        ['hive-storage-stats-no-reliable-data', 'partial-data'],
        ['empty-node-warden-bridge-info', 'partial-data'],
        ['some-code-of-a-newer-backend', 'partial-data'],
        ['filter-not-applied', 'filter-not-applied'],
        ['sort-not-applied', 'sort-not-applied'],
        ['group-not-applied', 'group-not-applied'],
    ])('Should classify %s as %s', (problem, issue) => {
        expect(getStorageGroupsDataIssues(quality([problem]))).toEqual([issue]);
    });

    test('Should not report an unapplied operation twice when the code comes with its flag', () => {
        expect(getStorageGroupsDataIssues(quality(['sort-not-applied'], {needSort: true}))).toEqual(
            ['sort-not-applied'],
        );
    });

    test.each<[Partial<ResponseDataQuality>, DataIssueKind]>([
        [{needFilter: true}, 'filter-not-applied'],
        [{needSort: true}, 'sort-not-applied'],
        [{needGroup: true}, 'group-not-applied'],
    ])('Should report the unapplied operation for %j', (flags, issue) => {
        expect(getStorageGroupsDataIssues(quality([], flags))).toEqual([issue]);
    });

    test('Should report every issue once in the display order', () => {
        expect(
            getStorageGroupsDataIssues(
                quality(
                    ['bsc-pdisks-no-data', 'bsc-timeout', 'bsc-storage-groups-no-data', 'unknown'],
                    {needSort: true},
                ),
            ),
        ).toEqual(['list-incomplete', 'sort-not-applied', 'partial-data']);
    });
});

describe('getNodesDataIssues', () => {
    const anyNodes: NodesDataIssuesContext = {};
    const databaseNodes: NodesDataIssuesContext = {hasDatabase: true};
    const storageNodes: NodesDataIssuesContext = {storageNodes: true};
    const groupNodes: NodesDataIssuesContext = {storageNodes: true, hasGroupFilter: true};

    test('Should report nothing without a response or for a clean response', () => {
        expect(getNodesDataIssues(undefined)).toEqual([]);
        expect(getNodesDataIssues(quality(), groupNodes)).toEqual([]);
    });

    test.each<[string, NodesDataIssuesContext, DataIssueKind]>([
        // the handler clears the list
        ['no-database-info', databaseNodes, 'database-unavailable'],
        ['no-shared-database-info', databaseNodes, 'database-unavailable'],
        // the list of nodes itself
        ['no-nodes-info', anyNodes, 'list-incomplete'],
        // database nodes are resolved through Hive
        ['hive-error', databaseNodes, 'list-incomplete'],
        ['hive-timeout', databaseNodes, 'list-incomplete'],
        ['hive-no-data', databaseNodes, 'list-incomplete'],
        ['no-database-board-info', databaseNodes, 'list-incomplete'],
        ['no-shared-database-board-info', databaseNodes, 'list-incomplete'],
        ['hive-error', anyNodes, 'partial-data'],
        ['hive-timeout', storageNodes, 'partial-data'],
        ['no-database-board-info', anyNodes, 'partial-data'],
        // nodes that did not answer in time are marked as disconnected
        ['wb-incomplete', anyNodes, 'nodes-status-unreliable'],
        ['wb-incomplete', groupNodes, 'nodes-status-unreliable'],
        // the group filter is resolved through BS controller
        ['bsc-error', groupNodes, 'filter-not-applied'],
        ['bsc-timeout', groupNodes, 'filter-not-applied'],
        ['bsc-storage-slots-no-data', groupNodes, 'filter-not-applied'],
        ['bsc-pdisks-no-data', {hasGroupFilter: true}, 'filter-not-applied'],
        // disks of unavailable nodes come from BS controller only
        ['bsc-error', storageNodes, 'disks-unavailable'],
        ['bsc-timeout', storageNodes, 'disks-unavailable'],
        ['bsc-storage-pools-no-data', storageNodes, 'disks-unavailable'],
        ['bsc-storage-groups-no-data', storageNodes, 'disks-unavailable'],
        ['bsc-storage-slots-no-data', storageNodes, 'disks-unavailable'],
        ['bsc-pdisks-no-data', storageNodes, 'disks-unavailable'],
        ['bsc-timeout', anyNodes, 'partial-data'],
        ['bsc-pdisks-no-data', databaseNodes, 'partial-data'],
        // everything else
        ['no-node-state-info', anyNodes, 'partial-data'],
        ['no-path-info', databaseNodes, 'partial-data'],
        ['some-code-of-a-newer-backend', groupNodes, 'partial-data'],
        // newer backends name the unapplied operation themselves
        ['filter-not-applied', anyNodes, 'filter-not-applied'],
        ['filter-not-applied', groupNodes, 'filter-not-applied'],
        ['sort-not-applied', anyNodes, 'sort-not-applied'],
        ['group-not-applied', databaseNodes, 'group-not-applied'],
    ])('Should classify %s in %j as %s', (problem, context, issue) => {
        expect(getNodesDataIssues(quality([problem]), context)).toEqual([issue]);
    });

    test.each<[Partial<ResponseDataQuality>, DataIssueKind]>([
        [{needFilter: true}, 'filter-not-applied'],
        [{needSort: true}, 'sort-not-applied'],
        [{needGroup: true}, 'group-not-applied'],
    ])('Should report the unapplied operation for %j', (flags, issue) => {
        expect(getNodesDataIssues(quality([], flags))).toEqual([issue]);
    });

    test('Should report every issue once in the display order', () => {
        expect(
            getNodesDataIssues(
                quality(['wb-incomplete', 'bsc-timeout', 'bsc-storage-slots-no-data'], {
                    needFilter: true,
                }),
                groupNodes,
            ),
        ).toEqual(['filter-not-applied', 'nodes-status-unreliable']);

        expect(
            getNodesDataIssues(
                quality(['no-node-state-info', 'hive-timeout', 'no-database-info']),
                databaseNodes,
            ),
        ).toEqual(['database-unavailable', 'list-incomplete', 'partial-data']);
    });
});
