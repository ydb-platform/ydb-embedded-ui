import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Route, Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {storageApi} from '../../../store/reducers/storage/storage';
import {PaginatedStorageGroups} from '../PaginatedStorageGroups/PaginatedStorageGroups';
import {PaginatedStorageGroupsTable} from '../PaginatedStorageGroupsTable';
import {PaginatedStorageNodes} from '../PaginatedStorageNodes/PaginatedStorageNodes';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';

jest.mock('../PaginatedStorageGroupsTable', () => ({
    PaginatedStorageGroupsTable: jest.fn(() => null),
}));
jest.mock('../PaginatedStorageNodesTable/PaginatedStorageNodesTable', () => ({
    PaginatedStorageNodesTable: jest.fn(() => null),
}));
jest.mock('../../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));
jest.mock('../../../store/reducers/storage/storage', () => ({
    storageApi: {
        useGetStorageGroupsInfoQuery: jest.fn(),
        useGetStorageNodesInfoQuery: jest.fn(),
    },
}));
jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: () => true,
    useStorageGroupsHandlerHasGrouping: () => true,
    useViewerNodesHandlerHasGrouping: () => true,
    useViewerNodesAliveFilterAvailable: () => false,
    useBlobStorageCapacityMetricsAvailable: () => false,
    useBlobStorageCapacityMetricsEnabled: () => false,
    useBridgeModeEnabled: () => false,
}));
jest.mock('../../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [0],
    useSetting: (_key: string, defaultValue: unknown) => [defaultValue, jest.fn()],
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: () => false,
    useIsViewerUser: () => true,
}));
jest.mock('../PaginatedStorageGroupsTable/columns/hooks', () => ({
    useStorageGroupsSelectedColumns: () => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    }),
}));
jest.mock('../PaginatedStorageNodes/useStorageNodesColumnsToSelect', () => ({
    useStorageNodesColumnsToSelect: () => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    }),
}));

// Exercise the real page, controls and query hooks; mock only the data boundary and column setup.
describe.each([
    {
        type: 'groups',
        searchParam: 'groupsSearch',
        groupParam: 'storageGroupsGroupBy',
        group: 'PoolName',
        Page: PaginatedStorageGroups,
        Table: PaginatedStorageGroupsTable,
        query: storageApi.useGetStorageGroupsInfoQuery,
    },
    {
        type: 'nodes',
        searchParam: 'nodesSearch',
        groupParam: 'storageNodesGroupBy',
        group: 'Host',
        Page: PaginatedStorageNodes,
        Table: PaginatedStorageNodesTable,
        query: storageApi.useGetStorageNodesInfoQuery,
    },
])('Storage $type search', ({type, searchParam, groupParam, group, Page, Table, query}) => {
    const mockTable = jest.mocked(Table);
    const mockQuery = jest.mocked(query);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        jest.mocked(storageApi.useGetStorageGroupsInfoQuery).mockReturnValue({
            currentData: {tableGroups: []},
            isFetching: false,
            refetch: jest.fn(),
        } as ReturnType<typeof storageApi.useGetStorageGroupsInfoQuery>);
        jest.mocked(storageApi.useGetStorageNodesInfoQuery).mockReturnValue({
            currentData: {tableGroups: []},
            isFetching: false,
            refetch: jest.fn(),
        } as ReturnType<typeof storageApi.useGetStorageNodesInfoQuery>);
    });
    afterEach(() => jest.useRealTimers());

    function setup(grouped = false, entries?: string[]) {
        const history = createMemoryHistory({
            initialIndex: entries ? entries.length - 1 : 0,
            initialEntries: entries ?? [
                `/cluster/storage?type=${type}&${searchParam}=a${grouped ? `&${groupParam}=${group}` : ''}`,
            ],
        });
        render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <Route
                        render={({location}) => (
                            <Page
                                groupId={
                                    new URLSearchParams(location.search).get('groupId') ?? undefined
                                }
                                scrollContainerRef={React.createRef<HTMLElement>()}
                            />
                        )}
                    />
                </QueryParamProvider>
            </Router>,
        );
        return {history, input: screen.getByRole('textbox')};
    }

    it.each([false, true])(
        'updates the URL immediately and delays the data filter (grouped: %s)',
        (grouped) => {
            const {history, input} = setup(grouped);
            fireEvent.change(input, {target: {value: 'abc'}});
            expect(input).toHaveValue('abc');
            expect(new URLSearchParams(history.location.search).get(searchParam)).toBe('abc');
            const expectFilter = (value: string) =>
                grouped
                    ? expect(mockQuery).toHaveBeenLastCalledWith(
                          expect.objectContaining({filter: value}),
                          expect.any(Object),
                      )
                    : expect(mockTable).toHaveBeenLastCalledWith(
                          expect.objectContaining({searchValue: value}),
                          {},
                      );
            act(() => jest.advanceTimersByTime(199));
            expectFilter('a');
            act(() => jest.advanceTimersByTime(1));
            expectFilter('abc');
        },
    );

    it.each([false, true])(
        'resets the filter immediately on Back/Forward between groups (grouped: %s)',
        (grouped) => {
            const entries = ['one', 'two'].map(
                (id) =>
                    `/storageGroup?groupId=${id}&type=${type}&${searchParam}=${id}${grouped ? `&${groupParam}=${group}` : ''}`,
            );
            const {history, input} = setup(grouped, entries);
            const expectFilter = (id: string, value = id) => {
                expect(input).toHaveValue(value);
                if (grouped) {
                    expect(mockQuery).toHaveBeenCalled();
                    for (const [params] of mockQuery.mock.calls) {
                        expect(params).toEqual(
                            expect.objectContaining({
                                [type === 'nodes' ? 'group_id' : 'groupId']: id,
                                filter: value,
                            }),
                        );
                    }
                } else {
                    expect(mockTable).toHaveBeenCalled();
                    for (const [props] of mockTable.mock.calls) {
                        expect(props).toEqual(
                            expect.objectContaining({groupId: id, searchValue: value}),
                        );
                    }
                }
            };
            fireEvent.change(input, {target: {value: 'pending'}});
            jest.clearAllMocks();
            act(() => history.goBack());
            expectFilter('one');
            act(() => jest.advanceTimersByTime(200));
            expectFilter('one');
            jest.clearAllMocks();
            act(() => history.goForward());
            expectFilter('two', 'pending');
            act(() => jest.advanceTimersByTime(200));
            expectFilter('two', 'pending');
        },
    );

    it('keeps the latest search through both grouping switches', () => {
        const {history, input} = setup();
        fireEvent.change(input, {target: {value: 'abc'}});
        act(() =>
            history.replace(
                `${history.location.pathname}${history.location.search}&${groupParam}=${group}`,
            ),
        );
        const groupedInput = screen.getByRole('textbox');
        expect(groupedInput).not.toBe(input);
        expect(groupedInput).toHaveValue('abc');
        expect(mockQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({filter: 'abc'}),
            expect.any(Object),
        );
        fireEvent.change(groupedInput, {target: {value: 'abcd'}});
        act(() => {
            const params = new URLSearchParams(history.location.search);
            params.delete(groupParam);
            history.replace(`${history.location.pathname}?${params}`);
        });
        expect(screen.getByRole('textbox')).not.toBe(groupedInput);
        expect(screen.getByRole('textbox')).toHaveValue('abcd');
        act(() => jest.advanceTimersByTime(200));
        expect(mockTable).toHaveBeenLastCalledWith(
            expect.objectContaining({searchValue: 'abcd'}),
            {},
        );
    });
});
