import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {NodesControls} from '../../../containers/Nodes/NodesControls/NodesControls';
import {useNodesPageQueryParams} from '../../../containers/Nodes/useNodesPageQueryParams';
import {StorageGroupsControls} from '../../../containers/Storage/PaginatedStorageGroups/StorageGroupsControls';
import {useStorageQueryParams} from '../../../containers/Storage/useStorageQueryParams';
import {useTenantsQueryParams} from '../../../containers/Tenants/useTenantsQueryParams';
import {Search} from '../Search';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useViewerNodesHandlerHasGroupingBySystemState: () => true,
    useViewerNodesHandlerHasNetworkStats: () => false,
    useViewerNodesAliveFilterAvailable: () => false,
    useCapabilitiesLoaded: () => true,
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

function NodesSearch({revision}: {revision: number}) {
    const {searchValue} = useNodesPageQueryParams([], false);
    return (
        <React.Fragment>
            <NodesControls
                groupByParams={[]}
                withGroupBySelect
                entitiesCountCurrent={revision}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{searchValue}</output>
        </React.Fragment>
    );
}

function GroupsSearch({revision}: {revision: number}) {
    const {groupsSearchValue} = useStorageQueryParams();
    return (
        <React.Fragment>
            <StorageGroupsControls
                withGroupBySelect
                entitiesCountCurrent={revision}
                entitiesLoading={false}
            />
            <output aria-label="Table filter">{groupsSearchValue}</output>
        </React.Fragment>
    );
}

function DatabasesSearch({revision}: {revision: number}) {
    const {search, handleSearchChange} = useTenantsQueryParams();
    return (
        <React.Fragment>
            <Search tableFilter value={search} onChange={handleSearchChange} />
            <output aria-label="Table filter" data-revision={revision}>
                {search}
            </output>
        </React.Fragment>
    );
}

describe.each([
    {page: 'nodes', param: 'search', Fixture: NodesSearch},
    {page: 'storage', param: 'groupsSearch', Fixture: GroupsSearch},
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
        const {rerender} = render(content(0));
        return {
            history,
            user,
            input: screen.getByRole('textbox'),
            refresh: () => rerender(content(1)),
        };
    }

    it('updates text immediately and debounces the URL and table filter', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'bc');

        expect(input).toHaveValue('abc');
        expect(new URLSearchParams(history.location.search).get(param)).toBe('a');
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
            // Type before React commits the previous debounced URL update.
            fireEvent.change(input, {target: {value: nextValue}});
        });

        expect(input).toHaveValue(nextValue);
        expect(input).toHaveFocus();
        expect(new URLSearchParams(history.location.search).get(param)).toBe('ab');

        act(() => jest.advanceTimersByTime(200));
        expect(input).toHaveValue(nextValue);
        expect(new URLSearchParams(history.location.search).get(param)).toBe(nextValue || null);
        expect(screen.getByRole('status').textContent).toBe(nextValue);
    });

    it('accepts Back, Forward and external clearing', async () => {
        const {history, user, input} = setup();
        await user.type(input, 'b');
        act(() => jest.advanceTimersByTime(200));

        act(() => history.goBack());
        expect(input).toHaveValue('previous');
        expect(screen.getByRole('status')).toHaveTextContent(/^previous$/);

        act(() => history.goForward());
        expect(input).toHaveValue('ab');
        act(() => history.replace(`/cluster/${page}`));
        expect(input).toHaveValue('');
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
        expect(history.location.search).toBe('');
    });
});
