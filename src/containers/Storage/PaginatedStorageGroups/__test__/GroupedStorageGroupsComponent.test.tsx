import React from 'react';

import {act, render, screen} from '@testing-library/react';

import type {PaginatedTableWithLayoutProps} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import type {PreparedStorageResponse} from '../../../../store/reducers/storage/types';
import type {TableDataWithQuality} from '../../../../utils/dataIssues/types';
import {GroupedStorageGroupsComponent} from '../GroupedStorageGroupsComponent';

jest.mock('../../../../components/PaginatedTable/PaginatedTableWithLayout', () => ({
    PaginatedTableWithLayout: ({notice, error, table}: PaginatedTableWithLayoutProps) => (
        <div>
            <div data-testid="notice">{notice}</div>
            {error}
            <div data-testid="table">{table}</div>
        </div>
    ),
}));

jest.mock('../../../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));

jest.mock('../../../../store/reducers/storage/storage', () => ({
    storageApi: {useGetStorageGroupsInfoQuery: jest.fn()},
}));

jest.mock('../../../../utils/hooks', () => ({
    useAutoRefreshInterval: jest.fn(() => [0]),
}));

jest.mock('../../PaginatedStorageGroupsTable', () => ({
    PaginatedStorageGroupsTable: jest.fn(() => null),
}));

jest.mock('../../PaginatedStorageGroupsTable/columns/hooks', () => ({
    useStorageGroupsSelectedColumns: jest.fn(() => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    })),
}));

jest.mock('../../useStorageQueryParams', () => ({
    useStorageQueryParams: jest.fn(() => ({
        groupsSearchValue: '',
        storageGroupsGroupByParam: 'MediaType',
        visibleEntities: 'all',
        handleShowAllGroups: jest.fn(),
    })),
}));

jest.mock('../StorageGroupsControls', () => ({
    StorageGroupsControls: () => null,
}));

const {useGetStorageGroupsInfoQuery} = jest.requireMock(
    '../../../../store/reducers/storage/storage',
).storageApi as {useGetStorageGroupsInfoQuery: jest.Mock};
const PaginatedStorageGroupsTableMock = jest.requireMock('../../PaginatedStorageGroupsTable')
    .PaginatedStorageGroupsTable as jest.Mock;

const cleanQuality = {problems: [], needFilter: false, needSort: false, needGroup: false};

function renderGroups(currentData: PreparedStorageResponse) {
    useGetStorageGroupsInfoQuery.mockReturnValue({currentData, isFetching: false});

    render(<GroupedStorageGroupsComponent scrollContainerRef={React.createRef<HTMLElement>()} />);
}

describe('GroupedStorageGroupsComponent', () => {
    beforeEach(() => {
        PaginatedStorageGroupsTableMock.mockClear();
    });

    test('shows groups without a warning for a clean response', () => {
        renderGroups({
            found: 3,
            total: 3,
            tableGroups: [{name: 'SSD', count: 3}],
            ...cleanQuality,
        });

        expect(screen.getByText('SSD')).toBeInTheDocument();
        expect(screen.getByTestId('notice')).toBeEmptyDOMElement();
    });

    test('keeps the regular empty message when there are no groups and no problems', () => {
        renderGroups({found: 0, total: 0, groups: [], ...cleanQuality});

        expect(screen.getByTestId('table')).toHaveTextContent('No such groups');
        expect(screen.getByTestId('notice')).toBeEmptyDOMElement();
    });

    test('warns that grouping was not applied instead of saying there are no groups', () => {
        renderGroups({
            found: 2,
            total: 2,
            groups: [{GroupId: '1'}, {GroupId: '2'}] as PreparedStorageResponse['groups'],
            ...cleanQuality,
            problems: ['bsc-timeout', 'bsc-storage-pools-no-data'],
            needGroup: true,
        });

        const notice = screen.getByTestId('notice');
        expect(notice).toHaveTextContent('Grouping was not applied.');
        expect(notice).toHaveTextContent('The list may be incomplete');
        expect(notice).toHaveTextContent('bsc-timeout, bsc-storage-pools-no-data');
        expect(screen.getByTestId('table')).toBeEmptyDOMElement();
    });

    test('treats a plain list of storage groups as grouping that was not applied', () => {
        renderGroups({
            found: 1,
            total: 1,
            groups: [{GroupId: '1'}] as PreparedStorageResponse['groups'],
            ...cleanQuality,
        });

        expect(screen.getByTestId('notice')).toHaveTextContent('Grouping was not applied.');
        expect(screen.getByTestId('table')).toBeEmptyDOMElement();
    });

    test('does not claim there are no groups when the list may be incomplete', () => {
        renderGroups({
            found: 0,
            total: 0,
            groups: [],
            ...cleanQuality,
            problems: ['bsc-error'],
        });

        expect(screen.getByTestId('notice')).toHaveTextContent('The list may be incomplete');
        expect(screen.getByTestId('table')).toHaveTextContent(
            'Nothing to show, but the data may be incomplete',
        );
    });

    test('adds problems reported by the table of an expanded group', () => {
        renderGroups({
            found: 3,
            total: 3,
            tableGroups: [{name: 'SSD', count: 3}],
            ...cleanQuality,
        });

        act(() => screen.getByRole('button', {name: /SSD/}).click());

        const {onDataFetched} = PaginatedStorageGroupsTableMock.mock.calls[
            PaginatedStorageGroupsTableMock.mock.calls.length - 1
        ][0] as {onDataFetched: (data: TableDataWithQuality<unknown>) => void};

        act(() =>
            onDataFetched({
                data: [],
                found: 3,
                total: 3,
                dataQuality: {
                    ...cleanQuality,
                    problems: ['wb-incomplete-disks'],
                    receivedAt: 1,
                    requestKey: 'ssd',
                },
            }),
        );

        // The table of the expanded group has a layout of its own
        const [notice] = screen.getAllByTestId('notice');
        expect(notice).toHaveTextContent('Some data is unavailable');
        expect(notice).toHaveTextContent('wb-incomplete-disks');

        act(() => screen.getByRole('button', {name: /SSD/}).click());

        expect(screen.getByTestId('notice')).toBeEmptyDOMElement();
    });
});
