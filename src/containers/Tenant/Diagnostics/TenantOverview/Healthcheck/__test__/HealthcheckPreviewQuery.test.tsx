import {configureStore} from '@reduxjs/toolkit';
import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {healthcheckApi} from '../../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {HealthCheckAPIResponse} from '../../../../../../types/api/healthcheck';
import {SelfCheckResult} from '../../../../../../types/api/healthcheck';
import {useClusterNameFromQuery} from '../../../../../../utils/hooks/useDatabaseFromQuery';
import {useHealthcheck} from '../../../../Healthcheck/useHealthcheck';
import {HealthcheckPreview} from '../HealthcheckPreview';

jest.mock('../../../../../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [0],
    useTypedSelector: (selector: (state: unknown) => unknown) =>
        jest.requireActual('react-redux').useSelector(selector),
}));
jest.mock('../../../../../../store/reducers/tenant/tenant', () => ({
    useTenantBaseInfo: () => ({databaseType: 'Dedicated'}),
}));
jest.mock('../../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({handleShowHealthcheckChange: jest.fn()}),
}));

const database = '/shared-name';
const degraded: HealthCheckAPIResponse = {
    self_check_result: SelfCheckResult.DEGRADED,
    issue_log: [
        {id: 'one', message: 'First issue'},
        {id: 'two', message: 'Second issue'},
    ],
};
const healthy: HealthCheckAPIResponse = {self_check_result: SelfCheckResult.GOOD, issue_log: []};

function DrawerData() {
    const clusterName = useClusterNameFromQuery();
    const {selfCheckResult, issues} = useHealthcheck(database, {
        clusterName,
        databaseType: 'Dedicated',
    });
    return <output data-testid="drawer-data">{`${selfCheckResult}:${issues.length}`}</output>;
}

describe('Healthcheck preview and drawer query identity', () => {
    const stores: ReturnType<typeof createStore>[] = [];
    const originalApi = Object.getOwnPropertyDescriptor(window, 'api');

    function createStore() {
        return configureStore({
            reducer: {[healthcheckApi.reducerPath]: healthcheckApi.reducer},
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(healthcheckApi.middleware),
        });
    }

    function setup(compact: boolean) {
        const store = createStore();
        stores.push(store);
        const history = createMemoryHistory({initialEntries: ['/?clusterName=alpha']});
        render(
            <Provider store={store}>
                <Router history={history}>
                    <QueryParamProvider adapter={ReactRouter5Adapter}>
                        <HealthcheckPreview database={database} compact={compact} />
                        <DrawerData />
                    </QueryParamProvider>
                </Router>
            </Provider>,
        );
        return {store, history};
    }

    afterEach(() => {
        cleanup();
        for (const store of stores.splice(0)) {
            store.dispatch(healthcheckApi.util.resetApiState());
        }
        if (originalApi) {
            Object.defineProperty(window, 'api', originalApi);
        } else {
            Reflect.deleteProperty(window, 'api');
        }
    });

    test.each([true, false])(
        'shares updates and isolates same-name databases, compact=%s',
        async (compact) => {
            const getHealthcheckInfo = jest.fn(async ({clusterName}: {clusterName?: string}) =>
                clusterName === 'alpha' ? degraded : healthy,
            );
            Object.defineProperty(window, 'api', {
                configurable: true,
                value: {viewer: {getHealthcheckInfo}},
            });
            const {store, history} = setup(compact);
            await waitFor(() =>
                expect(screen.getByTestId('drawer-data')).toHaveTextContent('DEGRADED:2'),
            );
            expect(
                screen.getByText(compact ? /Degraded: 2 issues/ : /2 issues/),
            ).toBeInTheDocument();
            expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);

            await act(async () => {
                await store.dispatch(
                    healthcheckApi.util.upsertQueryData(
                        'getHealthcheckInfo',
                        {database, clusterName: 'alpha'},
                        healthy,
                    ),
                );
            });
            await waitFor(() =>
                expect(screen.getByTestId('drawer-data')).toHaveTextContent('GOOD:0'),
            );
            expect(screen.queryByText(/2 issues/)).not.toBeInTheDocument();
            expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);

            act(() => history.push('/?clusterName=beta'));
            await waitFor(() => expect(getHealthcheckInfo).toHaveBeenCalledTimes(2));
            await waitFor(() =>
                expect(screen.getByTestId('drawer-data')).toHaveTextContent('GOOD:0'),
            );
            expect(screen.queryByText(/2 issues/)).not.toBeInTheDocument();
            expect(getHealthcheckInfo.mock.calls.map(([params]) => params.clusterName)).toEqual([
                'alpha',
                'beta',
            ]);
        },
    );
});
