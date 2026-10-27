import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {NodesControls} from '../../../containers/Nodes/NodesControls/NodesControls';
import {PaginatedNodes} from '../../../containers/Nodes/PaginatedNodes/PaginatedNodes';
import {useNodesPageQueryParams} from '../../../containers/Nodes/useNodesPageQueryParams';
import {PaginatedStorageGroups} from '../../../containers/Storage/PaginatedStorageGroups/PaginatedStorageGroups';
import {StorageGroupsControls} from '../../../containers/Storage/PaginatedStorageGroups/StorageGroupsControls';
import {PaginatedStorageNodes} from '../../../containers/Storage/PaginatedStorageNodes/PaginatedStorageNodes';
import {StorageNodesControls} from '../../../containers/Storage/PaginatedStorageNodes/StorageNodesControls';
import {useStorageQueryParams} from '../../../containers/Storage/useStorageQueryParams';
import {useTenantsQueryParams} from '../../../containers/Tenants/useTenantsQueryParams';
import {useDebouncedSearch} from '../../../utils/hooks/useDebouncedSearch';
import {Search} from '../Search';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useViewerNodesHandlerHasGroupingBySystemState: () => true,
    useViewerNodesHandlerHasNetworkStats: () => false,
    useViewerNodesAliveFilterAvailable: () => false,
    useCapabilitiesLoaded: () => true,
    useViewerNodesHandlerHasGrouping: () => true,
    useStorageGroupsHandlerHasGrouping: () => true,
    useBlobStorageCapacityMetricsAvailable: () => false,
    useBlobStorageCapacityMetricsEnabled: () => false,
    useBridgeModeEnabled: () => false,
}));

jest.mock('../../../utils/hooks', () => ({
    ...jest.requireActual('../../../utils/hooks'),
    useSetting: (_key: string, defaultValue: unknown) => [defaultValue, jest.fn()],
}));

jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => true,
    useIsUserAllowedToMakeChanges: () => false,
}));

jest.mock('../../../containers/Nodes/PaginatedNodes/NodesComponent', () => ({
    NodesComponent: () => <MockNodesSearch revision={0} />,
}));

jest.mock('../../../containers/Nodes/PaginatedNodes/GroupedNodesComponent', () => ({
    GroupedNodesComponent: () => <MockNodesSearch revision={0} />,
}));

jest.mock('../../../containers/Storage/PaginatedStorageGroups/StorageGroupsComponent', () => ({
    StorageGroupsComponent: () => <MockGroupsSearch revision={0} />,
}));

jest.mock(
    '../../../containers/Storage/PaginatedStorageGroups/GroupedStorageGroupsComponent',
    () => ({
        GroupedStorageGroupsComponent: () => <MockGroupsSearch revision={0} />,
    }),
);

jest.mock('../../../containers/Storage/PaginatedStorageNodes/StorageNodesComponent', () => ({
    StorageNodesComponent: () => <MockStorageNodesSearch revision={0} />,
}));

jest.mock('../../../containers/Storage/PaginatedStorageNodes/GroupedStorageNodesComponent', () => ({
    GroupedStorageNodesComponent: () => <MockStorageNodesSearch revision={0} />,
}));

function MockNodesSearch({revision}: {revision: number}) {
    const {searchValue} = useNodesPageQueryParams([], false);
    const searchFilter = useDebouncedSearch(searchValue);
    return (
        <React.Fragment>
            <NodesControls
                groupByParams={[]}
                withGroupBySelect
                entitiesCountCurrent={revision}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{searchFilter}</output>
        </React.Fragment>
    );
}

function MockGroupsSearch({revision}: {revision: number}) {
    const {groupsSearchValue} = useStorageQueryParams();
    const searchFilter = useDebouncedSearch(groupsSearchValue);
    return (
        <React.Fragment>
            <StorageGroupsControls
                withGroupBySelect
                entitiesCountCurrent={revision}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{searchFilter}</output>
        </React.Fragment>
    );
}

function MockStorageNodesSearch({revision}: {revision: number}) {
    const {nodesSearchValue} = useStorageQueryParams();
    const searchFilter = useDebouncedSearch(nodesSearchValue);
    return (
        <React.Fragment>
            <StorageNodesControls
                withGroupBySelect
                entitiesCountCurrent={revision}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{searchFilter}</output>
        </React.Fragment>
    );
}

function DatabasesSearch({revision}: {revision: number}) {
    const {search, handleSearchChange} = useTenantsQueryParams();
    const searchFilter = useDebouncedSearch(search);
    return (
        <React.Fragment>
            <Search debounce={0} tableFilter value={search} onChange={handleSearchChange} />
            <output aria-label="Table filter" data-revision={revision}>
                {searchFilter}
            </output>
        </React.Fragment>
    );
}

describe.each([
    {page: 'nodes', param: 'search', Fixture: MockNodesSearch},
    {page: 'storage', param: 'groupsSearch', Fixture: MockGroupsSearch},
    {page: 'storage-nodes', param: 'nodesSearch', Fixture: MockStorageNodesSearch},
    {page: 'databases', param: 'search', Fixture: DatabasesSearch},
])('$page search URL integration', ({page, param, Fixture}) => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const pathname = `/cluster/${page}`;
        const history = createMemoryHistory({
            initialIndex: 1,
            initialEntries: [
                `${pathname}?${param}=previous`,
                `${pathname}?${param}=a&database=%2Flocal&clusterName=test&backend=proxy`,
            ],
        });
        const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime});
        const content = (revision: number) => (
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <Fixture revision={revision} />
                </QueryParamProvider>
            </Router>
        );
        const {rerender, unmount} = render(content(0));
        return {
            history,
            user,
            input: screen.getByRole('textbox'),
            refresh: () => rerender(content(1)),
            unmount,
        };
    }

    it('updates text and URL immediately and debounces only the table filter', async () => {
        const {history, input} = setup();
        fireEvent.change(input, {target: {value: 'abc'}});

        expect(input).toHaveValue('abc');
        expect(new URLSearchParams(history.location.search).get(param)).toBe('abc');
        expect(screen.getByRole('status')).toHaveTextContent(/^a$/);

        act(() => jest.advanceTimersByTime(200));
        const params = new URLSearchParams(history.location.search);
        expect(params.get(param)).toBe('abc');
        expect(params.get('database')).toBe('/local');
        expect(params.get('clusterName')).toBe('test');
        expect(params.get('backend')).toBe('proxy');
        expect(history.length).toBe(2);
        expect(screen.getByRole('status')).toHaveTextContent(/^abc$/);
        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();
    });

    it.each(['abc', 'a', ''])('preserves the next edit %p across updates', async (nextValue) => {
        const {history, user, input, refresh} = setup();
        await user.type(input, 'b');
        refresh();
        expect(input).toHaveValue('ab');

        act(() => {
            jest.advanceTimersByTime(200);
            // Type before React commits the previous table filter update.
            fireEvent.change(input, {target: {value: nextValue}});
        });

        expect(input).toHaveValue(nextValue);
        expect(input).toHaveFocus();
        expect(new URLSearchParams(history.location.search).get(param)).toBe(nextValue || null);

        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue(nextValue);
        expect(new URLSearchParams(history.location.search).get(param)).toBe(nextValue || null);
        expect(screen.getByRole('status').textContent).toBe(nextValue);
    });

    it('keeps Back, Forward and external clearing while filtering is pending', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'b');
        act(() => history.goBack());
        expect(input).toHaveValue('previous');
        const previousUrl = history.location.search;
        act(() => jest.advanceTimersByTime(200));
        expect(history.location.search).toBe(previousUrl);
        expect(input).toHaveValue('previous');
        expect(screen.getByRole('status')).toHaveTextContent(/^previous$/);

        await user.type(input, 'next');
        act(() => history.goForward());
        expect(input).toHaveValue('ab');
        const forwardUrl = history.location.search;
        act(() => jest.advanceTimersByTime(200));
        expect(history.location.search).toBe(forwardUrl);
        expect(input).toHaveValue('ab');

        await user.type(input, 'b');
        act(() => history.replace(`/cluster/${page}`));
        expect(input).toHaveValue('');
        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue('');
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
        expect(history.location.search).toBe('');
    });

    it.each(['database', 'clusterName', 'backend', 'environment', 'schema', 'path'])(
        'does not carry a pending filter across %s changes with the same search',
        async (scopeParam) => {
            const {history, user, input} = setup();
            act(() => history.push(`/cluster/${page}?${param}=a&${scopeParam}=other`));
            await user.type(input, 'b');
            expect(new URLSearchParams(history.location.search).get(param)).toBe('ab');
            // Navigate while the latest filter (ab) is still pending.
            act(() => history.goBack());
            const destination = history.location.search;
            expect(input).toHaveValue('a');
            expect(screen.getByRole('status')).toHaveTextContent(/^a$/);
            act(() => jest.advanceTimersByTime(200));
            expect(history.location.search).toBe(destination);
            expect(input).toHaveValue('a');
            expect(screen.getByRole('status')).toHaveTextContent(/^a$/);
        },
    );

    it('does not write to the next page after the search unmounts', async () => {
        const {history, user, unmount} = setup();
        await user.type(screen.getByRole('textbox'), 'b');
        unmount();
        history.push('/another-page?search=keep');
        act(() => jest.advanceTimersByTime(200));
        expect(history.location.pathname).toBe('/another-page');
        expect(history.location.search).toBe('?search=keep');
    });
});

// Keep the real grouping switches and controls; replace data-loading children with search fixtures.
describe.each([
    {
        page: 'nodes',
        searchParam: 'search',
        groupParam: 'nodesGroupBy',
        group: 'Host',
        Page: PaginatedNodes,
    },
    {
        page: 'groups',
        searchParam: 'groupsSearch',
        groupParam: 'storageGroupsGroupBy',
        group: 'PoolName',
        Page: PaginatedStorageGroups,
    },
    {
        page: 'storage-nodes',
        searchParam: 'nodesSearch',
        groupParam: 'storageNodesGroupBy',
        group: 'Host',
        Page: PaginatedStorageNodes,
    },
])('$page grouping', ({searchParam, groupParam, group, Page}) => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('keeps the latest text when switching grouping before filtering finishes', () => {
        const history = createMemoryHistory({initialEntries: [`/cluster/nodes?${searchParam}=a`]});
        render(
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <Page
                        scrollContainerRef={React.createRef<HTMLDivElement>()}
                        groupByParams={['Host']}
                        columns={[]}
                        defaultColumnsIds={[]}
                        requiredColumnsIds={[]}
                        selectedColumnsKey="test"
                    />
                </QueryParamProvider>
            </Router>,
        );
        const input = screen.getByRole('textbox');
        fireEvent.change(input, {target: {value: 'abc'}});
        expect(screen.getByRole('status')).toHaveTextContent(/^a$/);
        act(() =>
            history.replace(
                `${history.location.pathname}${history.location.search}&${groupParam}=${group}`,
            ),
        );
        expect(screen.getByRole('textbox')).not.toBe(input);
        expect(screen.getByRole('textbox')).toHaveValue('abc');
        const groupedInput = screen.getByRole('textbox');
        fireEvent.change(groupedInput, {target: {value: 'abcd'}});
        act(() => {
            const params = new URLSearchParams(history.location.search);
            params.delete(groupParam);
            history.replace(`${history.location.pathname}?${params}`);
        });
        expect(screen.getByRole('textbox')).not.toBe(groupedInput);
        expect(screen.getByRole('textbox')).toHaveValue('abcd');
        act(() => jest.advanceTimersByTime(200));
        expect(new URLSearchParams(history.location.search).get(searchParam)).toBe('abcd');
        expect(screen.getByRole('status')).toHaveTextContent(/^abcd$/);
    });
});
