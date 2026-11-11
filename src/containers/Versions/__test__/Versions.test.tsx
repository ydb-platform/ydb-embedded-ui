import {render, screen} from '@testing-library/react';

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
    test('shows no warning when the nodes are loaded without problems', () => {
        renderVersions({});

        expect(screen.queryByText(/Problems reported by the server/)).not.toBeInTheDocument();
        expect(screen.queryByText(/did not respond in time/)).not.toBeInTheDocument();
    });

    test('warns that the versions are built from incomplete data of the nodes', () => {
        renderVersions({problems: ['wb-incomplete', 'hive-timeout']});

        expect(
            screen.getByText('Some nodes did not respond in time and may be shown as unavailable.'),
        ).toBeInTheDocument();
        // Hive problems do not make the list of cluster nodes incomplete
        expect(
            screen.getByText('Some data is unavailable: some values may be missing.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Problems reported by the server: wb-incomplete, hive-timeout'),
        ).toBeInTheDocument();
    });
});
