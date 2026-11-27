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
function setup(query: string, environments = ['prod', 'test']) {
    const history = createMemoryHistory({initialEntries: [`/home/databases?${query}`]});
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Router history={history}>
            <QueryParamProvider adapter={ReactRouter5Adapter}>{children}</QueryParamProvider>
        </Router>
    );
    const {result} = renderHook(
        () => useDatabasesPageEnvironment(environments, {syncToUrl: true}),
        {wrapper},
    );
    const change = (value: string) => act(() => result.current.handleEnvironmentChange(value));
    const search = () => Object.fromEntries(new URLSearchParams(history.location.search));
    return {change, search};
}

const filters = 'cluster=alpha&cloudId=cloud-a&databaseType=Dedicated&search=db';
const keptFilters = {databaseType: 'Dedicated', search: 'db'};
const allFilters = {...keptFilters, cluster: 'alpha', cloudId: 'cloud-a'};

test('drops the filters by clusters and clouds when another environment is opened', () => {
    const {change, search} = setup(`env=prod&${filters}`);

    change('test');

    expect(search()).toEqual({env: 'test', ...keptFilters});
});

test('keeps the filters of a shared link when the environment is only written to the URL', () => {
    // The page puts the environment it has chosen itself into the URL
    expect(setup(filters).search()).toEqual({env: 'prod', ...allFilters});
});

test.each([
    ['one of several environments', ['prod', 'test']],
    ['the only environment', ['prod']],
])('drops the filters of a link to an unavailable environment replaced with %s', (_case, envs) => {
    expect(setup(`env=retired&${filters}`, envs).search()).toEqual({env: 'prod', ...keptFilters});
});

test('does not write the only environment to the URL', () => {
    expect(setup(filters, ['prod']).search()).toEqual(allFilters);
});
