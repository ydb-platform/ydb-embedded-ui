import React from 'react';

import {act, render, screen} from '@testing-library/react';

import type {DataIssuesProps} from '../../../../components/DataIssuesAlert/DataIssuesAlert';
import type {PaginatedTableWithLayoutProps} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import type {PreparedStorageResponse} from '../../../../store/reducers/storage/types';
import type {ResponseDataQuality, TableDataWithQuality} from '../../../../utils/dataIssues/types';
import {GroupedNodesComponent} from '../GroupedNodesComponent';
import {NodesComponent} from '../NodesComponent';

jest.mock('../../../../components/PaginatedTable/PaginatedTableWithLayout', () => ({
    PaginatedTableWithLayout: ({controls, error, table}: PaginatedTableWithLayoutProps) => (
        <div>
            <div data-testid="controls">{controls}</div>
            {error}
            <div data-testid="table">{table}</div>
        </div>
    ),
}));

// The indicator keeps the details in a popover: show them inline to read what it tells
jest.mock('../../../../components/DataIssuesAlert/DataIssuesIndicator', () => {
    const {DataIssuesList} = jest.requireActual(
        '../../../../components/DataIssuesAlert/DataIssuesAlert',
    );

    return {
        DataIssuesIndicator: (props: DataIssuesProps) =>
            props.issues.length > 0 ? <DataIssuesList {...props} /> : null,
    };
});

jest.mock('../../../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useViewerNodesHandlerHasGrouping: jest.fn(() => true),
}));

jest.mock('../../../../store/reducers/cluster/cluster', () => ({
    useClusterWithProxy: jest.fn(() => false),
}));

jest.mock('../../../../store/reducers/nodes/nodes', () => ({
    nodesApi: {useGetNodesQuery: jest.fn()},
}));

jest.mock('../../../../utils/hooks', () => ({
    useAutoRefreshInterval: jest.fn(() => [0]),
}));

jest.mock('../../../../utils/hooks/useHideUnavailableNodes', () => ({
    useHideUnavailableNodes: jest.fn(() => ({hideUnavailable: false})),
}));

jest.mock('../../../../utils/hooks/useSelectedColumns', () => ({
    useSelectedColumns: jest.fn(() => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    })),
}));

jest.mock('../../NodesControls/NodesControls', () => ({
    NodesControls: ({dataIssuesIndicator}: {dataIssuesIndicator?: React.ReactNode}) =>
        dataIssuesIndicator ?? null,
}));

jest.mock('../../NodesTable', () => ({
    NodesTable: jest.fn(() => null),
}));

jest.mock('../../useNodesPageQueryParams', () => ({
    useNodesPageQueryParams: jest.fn(() => ({
        searchValue: '',
        uptimeFilter: 'All',
        peerRoleFilter: undefined,
        withProblems: false,
        groupByParam: 'Version',
    })),
}));

jest.mock('../NodesControlsWithTableState', () => ({
    NodesControlsWithTableState: ({dataIssuesIndicator}: {dataIssuesIndicator?: React.ReactNode}) =>
        dataIssuesIndicator ?? null,
}));

const {useGetNodesQuery} = jest.requireMock('../../../../store/reducers/nodes/nodes').nodesApi as {
    useGetNodesQuery: jest.Mock;
};
const NodesTableMock = jest.requireMock('../../NodesTable').NodesTable as jest.Mock;

const cleanQuality: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

function tableData(quality: Partial<ResponseDataQuality>): TableDataWithQuality<never> {
    return {
        data: [],
        found: 0,
        total: 0,
        dataQuality: {...cleanQuality, ...quality},
    };
}

function getTableProps() {
    const {calls} = NodesTableMock.mock;

    return calls[calls.length - 1][0] as {
        onDataFetched?: (data: TableDataWithQuality<never>) => void;
        onChunkDataChange: (chunkOffset: number, data?: TableDataWithQuality<never>) => void;
        hasDataIssues?: boolean;
    };
}

const commonProps = {
    scrollContainerRef: React.createRef<HTMLElement>(),
    columns: [],
    defaultColumnsIds: [],
    requiredColumnsIds: [],
    selectedColumnsKey: 'nodes-columns',
    groupByParams: [],
};

describe('NodesComponent', () => {
    beforeEach(() => {
        NodesTableMock.mockClear();
    });

    test('shows no warning for a clean response and keeps the external callback', () => {
        const onDataFetched = jest.fn();
        render(<NodesComponent {...commonProps} onDataFetched={onDataFetched} />);

        act(() => getTableProps().onChunkDataChange(0, tableData({})));

        expect(getTableProps().onDataFetched).toBe(onDataFetched);
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
        expect(getTableProps().hasDataIssues).toBe(false);
    });

    test('warns that the list of database nodes may be incomplete without Hive', () => {
        render(<NodesComponent {...commonProps} database="/Root/db" />);

        act(() => getTableProps().onChunkDataChange(0, tableData({problems: ['hive-timeout']})));

        expect(screen.getByTestId('controls')).toHaveTextContent('The list may be incomplete');
        expect(getTableProps().hasDataIssues).toBe(true);
    });

    test('treats Hive problems of cluster nodes as partially unavailable data', () => {
        render(<NodesComponent {...commonProps} />);

        act(() => getTableProps().onChunkDataChange(0, tableData({problems: ['hive-timeout']})));

        const controls = screen.getByTestId('controls');
        expect(controls).toHaveTextContent('Some data is unavailable');
        expect(controls).not.toHaveTextContent('The list may be incomplete');
    });

    test('warns that sorting was not applied', () => {
        render(<NodesComponent {...commonProps} />);

        act(() => getTableProps().onChunkDataChange(0, tableData({needSort: true})));

        expect(screen.getByTestId('controls')).toHaveTextContent('Sorting was not applied');
    });
});

describe('GroupedNodesComponent', () => {
    function renderGroups(currentData: PreparedStorageResponse, database?: string) {
        useGetNodesQuery.mockReturnValue({currentData, isFetching: false});

        render(<GroupedNodesComponent {...commonProps} database={database} />);
    }

    beforeEach(() => {
        NodesTableMock.mockClear();
    });

    test('shows groups without a warning for a clean response', () => {
        renderGroups({
            found: 8,
            total: 8,
            tableGroups: [{name: '26.1', count: 8}],
            ...cleanQuality,
        });

        expect(screen.getByText('26.1')).toBeInTheDocument();
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
    });

    test('explains an empty list when database information is unavailable', () => {
        renderGroups(
            {found: 0, total: 0, nodes: [], ...cleanQuality, problems: ['no-database-info']},
            '/Root/db',
        );

        expect(screen.getByTestId('controls')).toHaveTextContent(
            'Database information is unavailable',
        );
        expect(screen.getByTestId('table')).toHaveTextContent(
            'Nothing to show, but the data may be incomplete',
        );
    });

    test('warns that grouping was not applied instead of saying there are no groups', () => {
        renderGroups({found: 8, total: 8, nodes: [], ...cleanQuality, needGroup: true});

        expect(screen.getByTestId('controls')).toHaveTextContent('Grouping was not applied.');
        expect(screen.getByTestId('table')).toHaveTextContent('Grouping was not applied.');
    });

    test('keeps the regular empty message when there are no nodes and no problems', () => {
        renderGroups({found: 0, total: 0, nodes: [], ...cleanQuality});

        expect(screen.getByTestId('table')).toHaveTextContent('No nodes groups');
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
    });

    test('adds problems reported by the table of an expanded group', () => {
        renderGroups({
            found: 8,
            total: 8,
            tableGroups: [{name: '26.1', count: 8}],
            ...cleanQuality,
        });

        act(() => screen.getByRole('button', {name: /26\.1/}).click());
        act(() => getTableProps().onChunkDataChange(0, tableData({problems: ['wb-incomplete']})));

        // The table of the expanded group has a layout of its own
        const [controls] = screen.getAllByTestId('controls');
        expect(controls).toHaveTextContent('Some nodes did not respond in time');
    });
});
