import React from 'react';

import {act, renderHook} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {useDatabasesPageEnvironment} from '../useDatabasesPageEnvironment';

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useMetaEnvironmentsAvailable: () => true,
}));
jest.mock('../../../utils/hooks', () => ({
    useSetting: () => [undefined, jest.fn()],
}));
jest.mock('../../Tenants/useMyDatabasesView', () => {
    const {ArrayParam} = jest.requireActual('use-query-params');
    return {ENVIRONMENT_FILTERS_PARAMS: {cluster: ArrayParam, cloudId: ArrayParam}};
});

const environments = ['prod', 'test'];

function setup(query: string) {
    const history = createMemoryHistory({initialEntries: [`/home/databases?${query}`]});
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>{children}</QueryParamProvider>
        </Router>
    );
    const {result} = renderHook(() => useDatabasesPageEnvironment(environments), {wrapper});
    const change = (value: string) => act(() => result.current.handleEnvironmentChange(value));
    const search = () => new URLSearchParams(history.location.search);
    return {change, search};
}

const filters = 'cluster=alpha&cloudId=cloud-a&databaseType=Dedicated&search=db';

test('drops the filters by clusters and clouds when another environment is opened', () => {
    const {change, search} = setup(`env=prod&${filters}`);

    change('test');

    expect(Object.fromEntries(search())).toEqual({
        env: 'test',
        databaseType: 'Dedicated',
        search: 'db',
    });
});

test('keeps the filters of a shared link when the environment is only written to the URL', () => {
    const {change, search} = setup(filters);

    // The page puts the environment it has chosen itself into the URL
    change('prod');

    expect(search().get('env')).toBe('prod');
    expect(search().getAll('cluster')).toEqual(['alpha']);
    expect(search().getAll('cloudId')).toEqual(['cloud-a']);
});
