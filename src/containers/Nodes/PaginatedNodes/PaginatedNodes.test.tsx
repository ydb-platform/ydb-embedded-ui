import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Route, Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {nodesApi} from '../../../store/reducers/nodes/nodes';
import {NodesTable} from '../NodesTable';

import {PaginatedNodes} from './PaginatedNodes';

jest.mock('../NodesTable', () => ({NodesTable: jest.fn(() => null)}));
jest.mock('../../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));
jest.mock('../../../store/reducers/nodes/nodes', () => ({
    nodesApi: {useGetNodesQuery: jest.fn()},
}));
jest.mock('../../../store/reducers/cluster/cluster', () => ({useClusterWithProxy: () => false}));
jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: () => true,
    useViewerNodesHandlerHasGrouping: () => true,
    useViewerNodesHandlerHasGroupingBySystemState: () => true,
    useViewerNodesHandlerHasNetworkStats: () => false,
    useViewerNodesAliveFilterAvailable: () => false,
}));
jest.mock('../../../utils/hooks', () => ({useAutoRefreshInterval: () => [0]}));
jest.mock('../../../utils/hooks/useSelectedColumns', () => ({
    useSelectedColumns: () => ({columnsToShow: [], columnsToSelect: [], setColumns: jest.fn()}),
}));
jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => true,
}));

const originalApi = window.api;
const getPath = jest.fn(() => '/first-backend');
beforeEach(() => {
    getPath.mockReturnValue('/first-backend');
    window.api = {viewer: {getPath}} as unknown as typeof window.api;
});
afterEach(() => {
    window.api = originalApi;
});

const mockTable = jest.mocked(NodesTable);
const mockQuery = jest.mocked(nodesApi.useGetNodesQuery);

function setup(grouped = false) {
    const history = createMemoryHistory({
        initialIndex: 1,
        initialEntries: [
            '/cluster/nodes?search=a&database=one',
            `/cluster/nodes?search=a&database=two${grouped ? '&nodesGroupBy=Host' : ''}`,
        ],
    });
    const renderPage = (props: Partial<React.ComponentProps<typeof PaginatedNodes>> = {}) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <Route
                    render={({location}) => (
                        <PaginatedNodes
                            database={
                                new URLSearchParams(location.search).get('database') ?? undefined
                            }
                            {...props}
                            scrollContainerRef={React.createRef<HTMLElement>()}
                            groupByParams={['Host']}
                            columns={[]}
                            defaultColumnsIds={[]}
                            requiredColumnsIds={[]}
                            selectedColumnsKey="test"
                        />
                    )}
                />
            </QueryParamProvider>
        </Router>
    );
    const view = render(renderPage());
    return {
        history,
        input: screen.getByRole('textbox'),
        updateProps: (props: Partial<React.ComponentProps<typeof PaginatedNodes>>) =>
            view.rerender(renderPage(props)),
    };
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockQuery.mockReturnValue({
        currentData: {tableGroups: []},
        isFetching: false,
        refetch: jest.fn(),
    } as ReturnType<typeof nodesApi.useGetNodesQuery>);
});
afterEach(() => jest.useRealTimers());

it.each([false, true])(
    'shows text immediately and delays the URL and data filter (grouped: %s)',
    (grouped) => {
        const {history, input} = setup(grouped);
        fireEvent.change(input, {target: {value: 'abc'}});
        expect(input).toHaveValue('abc');
        expect(new URLSearchParams(history.location.search).get('search')).toBe('a');
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
        act(() => {
            jest.advanceTimersByTime(1);
            // A new keystroke arrives before the previous filter update commits.
            fireEvent.change(input, {target: {value: 'abcd'}});
        });
        expect(input).toHaveValue('abcd');
        expect(new URLSearchParams(history.location.search).get('search')).toBe('abc');
        expectFilter('abc');
        act(() => jest.advanceTimersByTime(200));
        expectFilter('abcd');
        expect(new URLSearchParams(history.location.search).get('search')).toBe('abcd');
        expect(new URLSearchParams(history.location.search).get('database')).toBe('two');
        expect(history.length).toBe(2);
    },
);

it('keeps the latest search through both grouping switches', () => {
    const {history, input} = setup();
    fireEvent.change(input, {target: {value: 'abc'}});
    act(() =>
        history.replace(`${history.location.pathname}${history.location.search}&nodesGroupBy=Host`),
    );
    const groupedInput = screen.getByRole('textbox');
    expect(groupedInput).not.toBe(input);
    expect(groupedInput).toHaveValue('abc');
    expect(mockQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({filter: 'a'}),
        expect.any(Object),
    );
    fireEvent.change(groupedInput, {target: {value: 'abcd'}});
    act(() => {
        const params = new URLSearchParams(history.location.search);
        params.delete('nodesGroupBy');
        history.replace(`${history.location.pathname}?${params}`);
    });
    expect(screen.getByRole('textbox')).not.toBe(groupedInput);
    expect(screen.getByRole('textbox')).toHaveValue('abcd');
    act(() => jest.advanceTimersByTime(200));
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'abcd'}), {});
});

it('cancels pending URL writes on Back and Forward', () => {
    const {history, input} = setup();
    fireEvent.change(input, {target: {value: 'abc'}});
    act(() => history.goBack());
    const destination = history.location.search;
    expect(input).toHaveValue('a');
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'a'}), {});
    act(() => jest.advanceTimersByTime(200));
    expect(history.location.search).toBe(destination);
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'a'}), {});
    fireEvent.change(input, {target: {value: 'other'}});
    act(() => history.goForward());
    const forwardUrl = history.location.search;
    expect(input).toHaveValue('a');
    act(() => jest.advanceTimersByTime(200));
    expect(history.location.search).toBe(forwardUrl);
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'a'}), {});
});

it.each([false, true])(
    'discards the previous target draft when the URL stays unchanged (grouped: %s)',
    (grouped) => {
        const {history, input, updateProps} = setup(grouped);
        const expectFilter = (filter: string) =>
            grouped
                ? expect(mockQuery).toHaveBeenLastCalledWith(
                      expect.objectContaining({filter}),
                      expect.any(Object),
                  )
                : expect(mockTable).toHaveBeenLastCalledWith(
                      expect.objectContaining({searchValue: filter}),
                      {},
                  );
        for (const props of [
            {database: 'three'},
            {database: 'three', path: '/three/table', databaseFullPath: '/three'},
        ]) {
            fireEvent.change(input, {target: {value: JSON.stringify(props)}});
            const url = history.location;
            updateProps(props);
            expect(history.location).toBe(url);
            expect(screen.getByRole('textbox')).toBe(input);
            expectFilter('a');
            expect(input).toHaveValue('a');
            if (grouped) {
                expect(mockQuery).toHaveBeenLastCalledWith(
                    expect.objectContaining({database: props.database}),
                    expect.any(Object),
                );
            } else {
                expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining(props), {});
            }
        }
        fireEvent.change(input, {target: {value: 'after-backend-change'}});
        const url = history.location;
        getPath.mockReturnValue('/second-backend');
        updateProps({database: 'three', path: '/three/table', databaseFullPath: '/three'});
        expect(history.location).toBe(url);
        expectFilter('a');
        expect(input).toHaveValue('a');
        act(() => jest.advanceTimersByTime(200));
        expectFilter('a');
        expect(input).toHaveValue('a');
    },
);
