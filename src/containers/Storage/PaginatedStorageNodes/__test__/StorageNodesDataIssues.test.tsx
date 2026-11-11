import React from 'react';

import {act, render, screen} from '@testing-library/react';

import type {DataIssuesProps} from '../../../../components/DataIssuesAlert/DataIssuesAlert';
import type {PaginatedTableWithLayoutProps} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import type {PreparedStorageResponse} from '../../../../store/reducers/storage/types';
import type {ResponseDataQuality} from '../../../../utils/dataIssues/types';
import type {StorageNodesPaginatedTableData} from '../../types';
import {GroupedStorageNodesComponent} from '../GroupedStorageNodesComponent';
import {StorageNodesComponent} from '../StorageNodesComponent';

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

jest.mock('../../../../store/reducers/storage/storage', () => ({
    storageApi: {useGetStorageNodesInfoQuery: jest.fn()},
}));

jest.mock('../../../../utils/hooks', () => ({
    useAutoRefreshInterval: jest.fn(() => [0]),
}));

jest.mock('../../../../utils/hooks/useHideUnavailableNodes', () => ({
    useHideUnavailableNodes: jest.fn(() => ({hideUnavailable: false})),
}));

jest.mock('../../PaginatedStorageNodesTable/PaginatedStorageNodesTable', () => ({
    PaginatedStorageNodesTable: jest.fn(() => null),
}));

jest.mock('../../useStorageQueryParams', () => ({
    useIsStorageExpertMode: jest.fn(() => false),
    useStorageQueryParams: jest.fn(() => ({
        nodesSearchValue: '',
        visibleEntities: 'all',
        nodesUptimeFilter: 'All',
        storageNodesGroupByParam: 'DC',
        handleShowAllNodes: jest.fn(),
    })),
}));

const mockHandleColumnsDataFetched = jest.fn();

jest.mock('../../utils', () => ({
    ...jest.requireActual('../../utils'),
    useStorageColumnsSettings: jest.fn(() => ({
        handleDataFetched: mockHandleColumnsDataFetched,
        columnsSettings: {},
        rowHeight: 40,
    })),
}));

jest.mock('../StorageNodesControls', () => ({
    StorageNodesControls: ({dataIssuesIndicator}: {dataIssuesIndicator?: React.ReactNode}) =>
        dataIssuesIndicator ?? null,
    StorageNodesControlsWithTableState: ({
        dataIssuesIndicator,
    }: {
        dataIssuesIndicator?: React.ReactNode;
    }) => dataIssuesIndicator ?? null,
}));

jest.mock('../useStorageNodesColumnsToSelect', () => ({
    useStorageNodesColumnsToSelect: jest.fn(() => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    })),
}));

const {useGetStorageNodesInfoQuery} = jest.requireMock('../../../../store/reducers/storage/storage')
    .storageApi as {useGetStorageNodesInfoQuery: jest.Mock};
const PaginatedStorageNodesTableMock = jest.requireMock(
    '../../PaginatedStorageNodesTable/PaginatedStorageNodesTable',
).PaginatedStorageNodesTable as jest.Mock;

const cleanQuality: ResponseDataQuality = {
    problems: [],
    needFilter: false,
    needSort: false,
    needGroup: false,
};

function tableData(quality: Partial<ResponseDataQuality>): StorageNodesPaginatedTableData {
    return {
        data: [],
        found: 0,
        total: 0,
        dataQuality: {...cleanQuality, ...quality},
    };
}

function getTableProps() {
    const {calls} = PaginatedStorageNodesTableMock.mock;

    return calls[calls.length - 1][0] as {
        onDataFetched: (data: StorageNodesPaginatedTableData) => void;
        onChunkDataChange: (chunkOffset: number, data?: StorageNodesPaginatedTableData) => void;
        hasDataIssues?: boolean;
    };
}

const scrollContainerRef = React.createRef<HTMLElement>();

describe('StorageNodesComponent', () => {
    beforeEach(() => {
        PaginatedStorageNodesTableMock.mockClear();
        mockHandleColumnsDataFetched.mockClear();
    });

    test('shows no warning for a clean response and keeps columns settings updated', () => {
        render(<StorageNodesComponent scrollContainerRef={scrollContainerRef} />);

        act(() => getTableProps().onChunkDataChange(0, tableData({})));

        // Columns settings keep their own callback
        expect(getTableProps().onDataFetched).toBe(mockHandleColumnsDataFetched);
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
        expect(getTableProps().hasDataIssues).toBe(false);
    });

    test('warns that disks of unavailable nodes are missing without BS controller', () => {
        render(<StorageNodesComponent scrollContainerRef={scrollContainerRef} />);

        act(() =>
            getTableProps().onChunkDataChange(
                0,
                tableData({problems: ['bsc-timeout', 'bsc-pdisks-no-data']}),
            ),
        );

        const controls = screen.getByTestId('controls');
        expect(controls).toHaveTextContent('Disks of unavailable nodes are not shown');
        expect(controls).not.toHaveTextContent('Filters were not applied');
        expect(controls).toHaveTextContent('bsc-timeout, bsc-pdisks-no-data');
        expect(getTableProps().hasDataIssues).toBe(true);
    });

    test('warns that the storage group filter was dropped without BS controller', () => {
        render(
            <StorageNodesComponent scrollContainerRef={scrollContainerRef} groupId="2181038080" />,
        );

        act(() =>
            getTableProps().onChunkDataChange(
                0,
                tableData({problems: ['bsc-storage-slots-no-data']}),
            ),
        );

        const controls = screen.getByTestId('controls');
        expect(controls).toHaveTextContent('Filters were not applied');
        expect(controls).not.toHaveTextContent('Disks of unavailable nodes');
    });

    test('does not blame the storage group filter for other problems of BS controller', () => {
        render(
            <StorageNodesComponent scrollContainerRef={scrollContainerRef} groupId="2181038080" />,
        );

        // The nodes of the group were resolved, only their disks were not received
        act(() =>
            getTableProps().onChunkDataChange(
                0,
                tableData({problems: ['bsc-timeout', 'bsc-pdisks-no-data']}),
            ),
        );

        const controls = screen.getByTestId('controls');
        expect(controls).toHaveTextContent('Disks of unavailable nodes');
        expect(controls).not.toHaveTextContent('Filters were not applied');
    });

    test('warns that slow nodes may look unavailable', () => {
        render(<StorageNodesComponent scrollContainerRef={scrollContainerRef} />);

        act(() => getTableProps().onChunkDataChange(0, tableData({problems: ['wb-incomplete']})));

        expect(screen.getByTestId('controls')).toHaveTextContent(
            'Some nodes did not respond in time and may be shown as unavailable.',
        );
    });
});

describe('GroupedStorageNodesComponent', () => {
    function renderGroups(
        currentData: PreparedStorageResponse,
        props: {groupId?: string; database?: string} = {},
    ) {
        useGetStorageNodesInfoQuery.mockReturnValue({currentData, isFetching: false});

        render(<GroupedStorageNodesComponent scrollContainerRef={scrollContainerRef} {...props} />);
    }

    beforeEach(() => {
        PaginatedStorageNodesTableMock.mockClear();
        mockHandleColumnsDataFetched.mockClear();
    });

    test('shows groups without a warning for a clean response', () => {
        renderGroups({
            found: 8,
            total: 8,
            tableGroups: [{name: 'dc-1', count: 8}],
            ...cleanQuality,
        });

        expect(screen.getByText('dc-1')).toBeInTheDocument();
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
    });

    test('warns that the storage group filter was dropped', () => {
        renderGroups(
            {
                found: 8,
                total: 8,
                tableGroups: [{name: 'dc-1', count: 8}],
                ...cleanQuality,
                problems: ['bsc-error', 'bsc-storage-slots-no-data'],
            },
            {groupId: '2181038080'},
        );

        expect(screen.getByTestId('controls')).toHaveTextContent('Filters were not applied');
    });

    test('warns that grouping was not applied instead of saying there are no nodes', () => {
        renderGroups({
            found: 1,
            total: 1,
            nodes: [{NodeId: 1}] as PreparedStorageResponse['nodes'],
            ...cleanQuality,
            needGroup: true,
        });

        expect(screen.getByTestId('controls')).toHaveTextContent('Grouping was not applied.');
        expect(screen.getByTestId('table')).toHaveTextContent('Grouping was not applied.');
    });

    test('keeps the regular empty message when there are no nodes and no problems', () => {
        renderGroups({found: 0, total: 0, nodes: [], ...cleanQuality});

        expect(screen.getByTestId('table')).toHaveTextContent('No such nodes');
        expect(screen.getByTestId('controls')).toBeEmptyDOMElement();
    });

    test('adds problems of an expanded group and keeps columns settings updated', () => {
        renderGroups({
            found: 8,
            total: 8,
            tableGroups: [{name: 'dc-1', count: 8}],
            ...cleanQuality,
        });

        act(() => screen.getByRole('button', {name: /dc-1/}).click());

        act(() => getTableProps().onChunkDataChange(0, tableData({problems: ['wb-incomplete']})));

        expect(getTableProps().onDataFetched).toBe(mockHandleColumnsDataFetched);
        // The table of the expanded group has a layout of its own
        const [controls] = screen.getAllByTestId('controls');
        expect(controls).toHaveTextContent('Some nodes did not respond in time');
    });
});
