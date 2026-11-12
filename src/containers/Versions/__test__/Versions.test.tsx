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
    useGetPreparedVersions: jest.fn(() => []),
    useVersionsDataMap: jest.fn(() => undefined),
}));

const {nodesApi} = jest.requireMock('../../../store/reducers/nodes/nodes');

function renderVersions(quality: Partial<ResponseDataQuality>) {
    const dataQuality: ResponseDataQuality = {
        problems: [],
        needFilter: false,
        needSort: false,
        needGroup: false,
        ...quality,
    };
    nodesApi.useGetNodesQuery.mockReturnValue({
        currentData: {nodes: [], found: 0, total: 0, dataQuality},
        isLoading: false,
    });

    return render(<VersionsContainer />);
}

describe('Versions data issues', () => {
    test('warns that the versions are built from incomplete data of the nodes', () => {
        renderVersions({problems: ['wb-incomplete', 'hive-timeout']});

        const issues = Array.from(document.querySelectorAll('[data-issue]')).map((item) =>
            item.getAttribute('data-issue'),
        );
        // Hive problems do not make the list of cluster nodes incomplete
        expect(issues).toEqual(['nodes-status-unreliable', 'partial-data']);
    });
});
