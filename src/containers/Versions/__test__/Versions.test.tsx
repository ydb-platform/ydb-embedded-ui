import {render} from '@testing-library/react';

import type {ResponseDataQuality} from '../../../utils/dataIssues/types';
import {VersionsContainer} from '../Versions';

jest.mock('use-query-params', () => ({
    StringParam: {},
    useQueryParams: () => [{groupBy: undefined}, jest.fn()],
}));

jest.mock('../../../components/VersionsBar/VersionsBar', () => ({
    VersionsBar: () => null,
}));

jest.mock('../../../store/reducers/clusters/clusters', () => ({
    clustersApi: {useGetClustersListQuery: jest.fn()},
}));

jest.mock('../../../store/reducers/nodes/nodes', () => ({
    nodesApi: {useGetNodesQuery: jest.fn()},
}));

jest.mock('../../../utils/hooks', () => ({
    useAutoRefreshInterval: jest.fn(() => [0]),
}));

jest.mock('../GroupedNodesTree/GroupedNodesTree', () => ({
    GroupedNodesTree: () => null,
}));

jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    useVersionsDataMap: jest.fn(() => undefined),
}));

const {nodesApi} = jest.requireMock('../../../store/reducers/nodes/nodes');

function quality(problems: string[] = [], needGroup = false): ResponseDataQuality {
    return {problems, needFilter: false, needSort: false, needGroup};
}

/** The list of nodes and, for a cluster without `MapVersions`, the nodes grouped by version */
function renderVersions(list: ResponseDataQuality, overall?: ResponseDataQuality) {
    nodesApi.useGetNodesQuery.mockImplementation((params: unknown) => {
        const grouped = typeof params === 'object' && params !== null && 'group' in params;
        if (grouped) {
            return {currentData: overall && {tableGroups: [], dataQuality: overall}};
        }
        return {
            currentData: {nodes: [], found: 0, total: 0, dataQuality: list},
            isLoading: false,
        };
    });

    return render(<VersionsContainer />);
}

function getIssues() {
    return Array.from(document.querySelectorAll('[data-issue]')).map((item) =>
        item.getAttribute('data-issue'),
    );
}

describe('Versions data issues', () => {
    test('warns that the versions are built from incomplete data of the nodes', () => {
        renderVersions(quality(['wb-incomplete', 'hive-timeout']));

        // Hive problems do not make the list of cluster nodes incomplete
        expect(getIssues()).toEqual(['nodes-status-unreliable', 'partial-data']);
    });

    test('warns about the problems of the request the Overall block is built from', () => {
        renderVersions(quality(), quality(['wb-incomplete']));

        expect(getIssues()).toEqual(['nodes-status-unreliable']);
    });

    test('does not warn about grouping: without it the versions are counted from the nodes', () => {
        renderVersions(quality(), quality([], true));

        expect(getIssues()).toEqual([]);
    });

    test('does not warn about grouping when the handler also reports it with a code', () => {
        renderVersions(quality(), quality(['group-not-applied'], true));

        expect(getIssues()).toEqual([]);
        expect(document.body.textContent).not.toContain('group-not-applied');
    });

    test('keeps the other problems of the request that was not grouped', () => {
        renderVersions(quality(), quality(['group-not-applied', 'wb-incomplete'], true));

        expect(getIssues()).toEqual(['nodes-status-unreliable']);
    });
});
