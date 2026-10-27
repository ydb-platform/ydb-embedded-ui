import React from 'react';

import {act, fireEvent, render, screen} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {tenantsApi} from '../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../store/reducers/tenants/types';

import type {DatabaseStatusClickHandler} from './DatabaseDrawerHealthcheck';
import {TenantsTable} from './TenantsTable';

jest.mock('../../components/ResizeableDataTable/ResizeableDataTable', () => ({
    ResizeableDataTable: jest.fn(() => null),
}));
jest.mock('../../components/TableColumnSetup/TableColumnSetup', () => ({
    TableColumnSetup: () => null,
}));
jest.mock('../../store/reducers/tenants/tenants', () => ({
    tenantsApi: {useGetTenantsInfoQuery: jest.fn()},
}));
jest.mock('../../store/reducers/cluster/cluster', () => ({useClusterBaseInfo: () => ({})}));
jest.mock('../../store/reducers/capabilities/hooks', () => ({useEmMetaAvailable: () => false}));
jest.mock('../../utils/hooks', () => ({useAutoRefreshInterval: () => [0]}));
jest.mock('../../utils/hooks/useSelectedColumns', () => ({
    useSelectedColumns: () => ({columnsToShow: [], columnsToSelect: [], setColumns: jest.fn()}),
}));
jest.mock('./DatabaseDrawerHealthcheck', () => ({
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
const mockTable = jest.mocked(ResizeableDataTable);
const mockQuery = jest.mocked(tenantsApi.useGetTenantsInfoQuery);

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockQuery.mockReturnValue({
        currentData: tenants,
        isFetching: false,
        refetch: jest.fn(),
    } as ReturnType<typeof tenantsApi.useGetTenantsInfoQuery>);
});
afterEach(() => jest.useRealTimers());

it('updates the search URL immediately and filters the actual table data after the delay', () => {
    const history = createMemoryHistory({initialEntries: ['/cluster/databases?clusterName=test']});
    render(
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>
                <TenantsTable scrollContainerRef={React.createRef<HTMLElement>()} />
            </QueryParamProvider>
        </Router>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'alpha'}});
    expect(input).toHaveValue('alpha');
    expect(history.location.search).toBe('?clusterName=test&search=alpha');
    act(() => jest.advanceTimersByTime(199));
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({data: tenants}), {});
    act(() => jest.advanceTimersByTime(1));
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({data: [tenants[0]]}), {});
    fireEvent.change(input, {target: {value: ''}});
    expect(history.location.search).toBe('?clusterName=test');
    act(() => jest.advanceTimersByTime(200));
    expect(mockTable).toHaveBeenLastCalledWith(expect.objectContaining({data: tenants}), {});
});
