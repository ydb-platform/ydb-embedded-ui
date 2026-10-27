import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {storageApi} from '../../store/reducers/storage/storage';
import {tenantsApi} from '../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {NodeNetwork} from '../Node/NodeNetwork/NodeNetwork';
import {NodeNetworkTable} from '../Node/NodeNetwork/NodeNetworkTable';
import {NodesTable} from '../Nodes/NodesTable';
import {PaginatedNodes} from '../Nodes/PaginatedNodes/PaginatedNodes';
import {PaginatedStorageGroups} from '../Storage/PaginatedStorageGroups/PaginatedStorageGroups';
import {PaginatedStorageGroupsTable} from '../Storage/PaginatedStorageGroupsTable';
import {PaginatedStorageNodes} from '../Storage/PaginatedStorageNodes/PaginatedStorageNodes';
import {PaginatedStorageNodesTable} from '../Storage/PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import type {DatabaseStatusClickHandler} from '../Tenants/DatabaseDrawerHealthcheck';
import {TenantsTable} from '../Tenants/TenantsTable';

jest.mock('../Nodes/NodesTable', () => ({NodesTable: jest.fn(() => null)}));
jest.mock('../Node/NodeNetwork/NodeNetworkTable', () => ({NodeNetworkTable: jest.fn(() => null)}));
jest.mock('../Node/NodeNetwork/columns', () => ({getNodeNetworkColumns: () => []}));
jest.mock('../Storage/PaginatedStorageGroupsTable', () => ({
    PaginatedStorageGroupsTable: jest.fn(() => null),
}));
jest.mock('../Storage/PaginatedStorageNodesTable/PaginatedStorageNodesTable', () => ({
    PaginatedStorageNodesTable: jest.fn(() => null),
}));
jest.mock('../../components/ResizeableDataTable/ResizeableDataTable', () => ({
    ResizeableDataTable: jest.fn(() => null),
}));
jest.mock('../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));
jest.mock('../../store/reducers/nodes/nodes', () => ({nodesApi: {useGetNodesQuery: jest.fn()}}));
jest.mock('../../store/reducers/storage/storage', () => ({
    storageApi: {
        useGetStorageGroupsInfoQuery: jest.fn(),
        useGetStorageNodesInfoQuery: jest.fn(),
    },
}));
jest.mock('../../store/reducers/tenants/tenants', () => ({
    tenantsApi: {useGetTenantsInfoQuery: jest.fn()},
}));
jest.mock('../../store/reducers/cluster/cluster', () => ({
    useClusterBaseInfo: () => ({}),
    useClusterWithProxy: () => false,
}));
jest.mock('../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: () => true,
    useStorageGroupsHandlerHasGrouping: () => true,
    useViewerNodesHandlerHasGrouping: () => true,
    useViewerNodesHandlerHasGroupingBySystemState: () => true,
    useViewerNodesHandlerHasNetworkStats: () => false,
    useViewerNodesAliveFilterAvailable: () => false,
    useBlobStorageCapacityMetricsAvailable: () => false,
    useBlobStorageCapacityMetricsEnabled: () => false,
    useBridgeModeEnabled: () => false,
    useEmMetaAvailable: () => false,
}));
jest.mock('../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [0],
    useSetting: (_key: string, defaultValue: unknown) => [defaultValue, jest.fn()],
}));
jest.mock('../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: () => false,
    useIsViewerUser: () => true,
}));
jest.mock('../../utils/hooks/useSelectedColumns', () => ({
    useSelectedColumns: () => ({columnsToShow: [], columnsToSelect: [], setColumns: jest.fn()}),
}));
jest.mock('../Storage/PaginatedStorageGroupsTable/columns/hooks', () => ({
    useStorageGroupsSelectedColumns: () => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    }),
}));
jest.mock('../Storage/PaginatedStorageNodes/useStorageNodesColumnsToSelect', () => ({
    useStorageNodesColumnsToSelect: () => ({
        columnsToShow: [],
        columnsToSelect: [],
        setColumns: jest.fn(),
    }),
}));
jest.mock('../Tenants/DatabaseDrawerHealthcheck', () => ({
    DatabaseDrawerHealthcheck: ({
        children,
    }: {
        children: (onStatusClick: DatabaseStatusClickHandler) => React.ReactNode;
    }) => children(jest.fn()),
}));

const tenants: PreparedTenant[] = ['alpha', 'beta'].map((Name) => ({
    Name,
    controlPlaneName: Name,
    sharedTenantName: undefined,
    sharedNodeIds: undefined,
    cpu: undefined,
    memory: undefined,
    storage: undefined,
    nodesCount: 0,
    groupsCount: 0,
}));
const scrollContainerRef = React.createRef<HTMLDivElement>();
const pages = [
    {
        name: 'Nodes',
        searchParam: 'search',
        Table: NodesTable,
        element: (
            <PaginatedNodes
                scrollContainerRef={scrollContainerRef}
                groupByParams={['Host']}
                columns={[]}
                defaultColumnsIds={[]}
                requiredColumnsIds={[]}
                selectedColumnsKey="test"
            />
        ),
        contextProps: {database: '/other'},
        grouping: 'nodesGroupBy=Host',
        groupedQuery: nodesApi.useGetNodesQuery,
    },
    {
        name: 'Storage Groups',
        searchParam: 'groupsSearch',
        Table: PaginatedStorageGroupsTable,
        element: <PaginatedStorageGroups scrollContainerRef={scrollContainerRef} />,
        contextProps: {groupId: 'other'},
        grouping: 'storageGroupsGroupBy=PoolName',
        groupedQuery: storageApi.useGetStorageGroupsInfoQuery,
    },
    {
        name: 'Storage Nodes',
        searchParam: 'nodesSearch',
        Table: PaginatedStorageNodesTable,
        element: <PaginatedStorageNodes scrollContainerRef={scrollContainerRef} />,
        contextProps: {nodeId: 'other'},
        grouping: 'storageNodesGroupBy=Host',
        groupedQuery: storageApi.useGetStorageNodesInfoQuery,
    },
    {
        name: 'Network',
        searchParam: 'search',
        Table: NodeNetworkTable,
        element: <NodeNetwork nodeId="one" scrollContainerRef={scrollContainerRef} />,
        contextProps: {nodeId: 'other'},
    },
    {
        name: 'Databases',
        searchParam: 'search',
        Table: ResizeableDataTable,
        element: <TenantsTable scrollContainerRef={scrollContainerRef} />,
        contextProps: {clusterName: 'other'},
    },
];
const originalApi = window.api;
const getPath = jest.fn(() => '/backend');
beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getPath.mockReturnValue('/backend');
    window.api = {viewer: {getPath}, storage: {getPath}} as unknown as typeof window.api;
    const queryResult = {currentData: {tableGroups: []}, isFetching: false, refetch: jest.fn()};
    jest.mocked(nodesApi.useGetNodesQuery).mockReturnValue(
        queryResult as ReturnType<typeof nodesApi.useGetNodesQuery>,
    );
    jest.mocked(storageApi.useGetStorageGroupsInfoQuery).mockReturnValue(
        queryResult as ReturnType<typeof storageApi.useGetStorageGroupsInfoQuery>,
    );
    jest.mocked(storageApi.useGetStorageNodesInfoQuery).mockReturnValue(
        queryResult as ReturnType<typeof storageApi.useGetStorageNodesInfoQuery>,
    );
    jest.mocked(tenantsApi.useGetTenantsInfoQuery).mockReturnValue({
        currentData: tenants,
        isFetching: false,
        refetch: jest.fn(),
    } as ReturnType<typeof tenantsApi.useGetTenantsInfoQuery>);
});
afterEach(() => {
    window.api = originalApi;
    jest.useRealTimers();
});

function setup(element: React.ReactElement) {
    const history = createMemoryHistory({initialEntries: ['/list']});
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>{children}</QueryParamProvider>
        </Router>
    );
    return {...render(element, {wrapper}), history};
}

it.each(pages)(
    '$name: delays the URL and actual table filtering',
    ({name, searchParam, element, Table}) => {
        const {history} = setup(element);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, {target: {value: 'alpha'}});
        expect(input).toHaveValue('alpha');
        act(() => jest.advanceTimersByTime(199));
        expect(history.location.search).toBe('');
        expect(Table).toHaveBeenLastCalledWith(
            expect.objectContaining(name === 'Databases' ? {data: tenants} : {searchValue: ''}),
            {},
        );
        act(() => jest.advanceTimersByTime(1));
        expect(new URLSearchParams(history.location.search).get(searchParam)).toBe('alpha');
        expect(Table).toHaveBeenLastCalledWith(
            expect.objectContaining(
                name === 'Databases' ? {data: [tenants[0]]} : {searchValue: 'alpha'},
            ),
            {},
        );
    },
);

it.each(pages.filter(({grouping}) => grouping))(
    '$name: retains drafts through both grouping switches',
    ({element, grouping, groupedQuery, Table, searchParam}) => {
        const {history} = setup(element);
        for (const [group, text] of [
            [grouping, 'alpha'],
            ['', 'beta'],
        ]) {
            const input = screen.getByRole('textbox');
            fireEvent.change(input, {target: {value: text}});
            act(() => history.replace(`/list?${group}`));
            expect(screen.getByRole('textbox')).not.toBe(input);
            expect(screen.getByRole('textbox')).toHaveValue(text);
        }
        act(() => jest.advanceTimersByTime(200));
        expect(Table).toHaveBeenLastCalledWith(expect.objectContaining({searchValue: 'beta'}), {});
        expect(new URLSearchParams(history.location.search).get(searchParam)).toBe('beta');
        fireEvent.change(screen.getByRole('textbox'), {target: {value: 'alpha'}});
        act(() =>
            history.replace(`${history.location.pathname}${history.location.search}&${grouping}`),
        );
        act(() => jest.advanceTimersByTime(200));
        expect(groupedQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({filter: 'alpha'}),
            expect.any(Object),
        );
    },
);

it.each(pages)(
    '$name: discards drafts after data context or backend changes',
    ({element, contextProps}) => {
        const {history, rerender} = setup(element);
        const initialLocation = history.location;
        const nextPage = React.cloneElement(element, contextProps);
        for (const update of [
            () => rerender(nextPage),
            () => {
                getPath.mockReturnValue('/other');
                rerender(React.cloneElement(nextPage));
            },
        ]) {
            fireEvent.change(screen.getByRole('textbox'), {target: {value: 'pending'}});
            act(update);
            expect(screen.getByRole('textbox')).toHaveValue('');
            act(() => jest.advanceTimersByTime(200));
            expect(history.location).toBe(initialLocation);
        }
    },
);
