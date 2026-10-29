import type React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {healthcheckApi} from '../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {EFlag} from '../../../../../types/api/enums';
import type {HealthCheckAPIResponse} from '../../../../../types/api/healthcheck';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import type {TTenant} from '../../../../../types/api/tenant';
import {TenantOverview} from '../TenantOverview';

let mockTenant: TTenant | undefined;
let mockNavigationV2 = false;
const POLLING_INTERVAL = 200;
let mockPollingInterval = POLLING_INTERVAL;
let mockMetaDatabasesAvailable = false;
let mockTenantQueryError: unknown;

jest.mock('../../../../../utils/hooks/useWhoami', () => ({
    useIsUserAllowedToMakeChanges: () => true,
}));

jest.mock('../../../../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [mockPollingInterval],
    useTypedSelector: jest.requireActual('react-redux').useSelector,
    useTypedDispatch: jest.requireActual('react-redux').useDispatch,
}));
jest.mock('../../../../../utils/hooks/useDatabasesV2', () => ({
    useDatabasesV2: () => mockMetaDatabasesAvailable,
}));
jest.mock('../../../utils/useNavigationV2Enabled', () => ({
    useNavigationV2Enabled: () => mockNavigationV2,
}));
jest.mock('../../../TenantNavigation/useTenantNavigation', () => ({
    useTenantPage: () => ({handleTenantPageChange: jest.fn()}),
}));
jest.mock('../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({handleShowHealthcheckChange: jest.fn()}),
}));
jest.mock('../../../../../store/reducers/tenant/tenant', () => ({
    tenantApi: {
        useGetTenantInfoQuery: () => ({currentData: mockTenant, error: mockTenantQueryError}),
    },
}));
jest.mock('../../../../../store/reducers/cluster/cluster', () => ({
    useClusterBaseInfo: () => ({}),
}));
jest.mock('../../../../../store/reducers/tenants/utils', () => ({
    calculateTenantMetrics: () => ({}),
}));
jest.mock('../metricOverview', () => ({getTenantOverviewMetrics: () => ({})}));
jest.mock('../../../../../components/EntityName/EntityName', () => ({
    EntityName: ({name, leadingContent}: {name: string; leadingContent: React.ReactNode}) => (
        <div>
            {leadingContent}
            {name}
        </div>
    ),
}));
jest.mock('../../../../../components/QueriesActivityBar/QueriesActivityBar', () => ({
    QueriesActivityBar: () => null,
}));
jest.mock('../MetricsTabs/MetricsTabs', () => ({MetricsTabs: () => null}));
jest.mock('../TenantCpu/TenantCpu', () => ({TenantCpu: () => null}));
jest.mock('../TenantMemory/TenantMemory', () => ({TenantMemory: () => null}));
jest.mock('../TenantNetwork/TenantNetwork', () => ({TenantNetwork: () => null}));
jest.mock('../TenantStorage/TenantStorageMode', () => ({TenantStorageMode: () => null}));

const database = '/shared-name';
const healthy: HealthCheckAPIResponse = {self_check_result: SelfCheckResult.GOOD, issue_log: []};
let healthcheckResult: HealthCheckAPIResponse;
const getHealthcheckInfo = jest.fn(async ({clusterName}: {clusterName?: string}) =>
    clusterName === 'beta' ? healthy : healthcheckResult,
);
const store = configureStore({
    reducer: {
        [healthcheckApi.reducerPath]: healthcheckApi.reducer,
        tenant: () => ({metricsTab: 'cpu'}),
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(healthcheckApi.middleware),
});
const originalApi = Object.getOwnPropertyDescriptor(window, 'api');
const statusColor = () => document.querySelector('.ydb-status-color');

function setup(clusterName?: string) {
    const history = createMemoryHistory({
        initialEntries: [clusterName ? '/?clusterName=' + clusterName : '/'],
    });
    const overview = () => (
        <Provider store={store}>
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <TenantOverview database={database} databaseFullPath={database} />
                </QueryParamProvider>
            </Router>
        </Provider>
    );
    const view = render(overview());
    return {history, rerender: () => view.rerender(overview())};
}

beforeEach(() => {
    getHealthcheckInfo.mockClear();
    mockTenant = {Name: database, Type: 'Dedicated', Overall: EFlag.Red};
    mockNavigationV2 = false;
    mockPollingInterval = POLLING_INTERVAL;
    mockMetaDatabasesAvailable = false;
    mockTenantQueryError = undefined;
    healthcheckResult = {
        self_check_result: SelfCheckResult.DEGRADED,
        issue_log: [{id: 'issue', message: 'Storage issue'}],
    };
    Object.defineProperty(window, 'api', {
        configurable: true,
        value: {viewer: {getHealthcheckInfo}},
    });
});

afterEach(() => {
    cleanup();
    store.dispatch(healthcheckApi.util.resetApiState());
    jest.useRealTimers();
    if (originalApi) {
        Object.defineProperty(window, 'api', originalApi);
    } else {
        Reflect.deleteProperty(window, 'api');
    }
});

test.each([undefined, 'alpha'])(
    'shares the preview query and polling, cluster=%s',
    async (clusterName) => {
        setup(clusterName);
        await screen.findByText(/1 issue/);
        expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);
        expect(statusColor()).toHaveClass('ydb-status-color_state_yellow');

        healthcheckResult = healthy;
        await waitFor(() => expect(statusColor()).toHaveClass('ydb-status-color_state_green'));
        expect(screen.queryByText(/1 issue/)).not.toBeInTheDocument();
        expect(getHealthcheckInfo).toHaveBeenCalledTimes(2);
    },
);

test('does not reuse status for the same database path in another cluster', async () => {
    const {history} = setup('alpha');
    await screen.findByText(/1 issue/);
    expect(statusColor()).toHaveClass('ydb-status-color_state_yellow');

    act(() => history.push('/?clusterName=beta'));
    await waitFor(() => expect(statusColor()).toHaveClass('ydb-status-color_state_green'));
    expect(screen.queryByText(/1 issue/)).not.toBeInTheDocument();
    expect(getHealthcheckInfo.mock.calls.map(([params]) => params.clusterName)).toEqual([
        'alpha',
        'beta',
    ]);
});

test.each(['navigation-v2', 'serverless', 'tenant-not-loaded'])(
    'does not request healthcheck for %s',
    (state) => {
        if (state === 'navigation-v2') {
            mockNavigationV2 = true;
        }
        if (state === 'serverless') {
            mockTenant = {...mockTenant, Type: 'Serverless'};
        }
        if (state === 'tenant-not-loaded') {
            mockTenant = undefined;
        }
        setup('alpha');
        expect(getHealthcheckInfo).not.toHaveBeenCalled();
        if (state === 'serverless') {
            expect(statusColor()).toHaveClass('ydb-status-color_state_red');
        }
    },
);

test('expires the Meta Serverless Overall fallback while Viewer healthcheck is skipped', () => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    mockTenant = {
        Name: database,
        Type: 'Serverless',
        Overall: EFlag.Green,
        healthExpiresAt: 2000,
    } as TTenant & {healthExpiresAt: number};
    setup('alpha');
    expect(statusColor()).toHaveClass('ydb-status-color_state_green');
    act(() => {
        jest.advanceTimersByTime(1000);
    });
    expect(statusColor()).toHaveClass('ydb-status-color_state_grey');
    expect(getHealthcheckInfo).not.toHaveBeenCalled();
    jest.useRealTimers();
});

test('cached Viewer GOOD does not override expired prepared Meta health', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    mockMetaDatabasesAvailable = true;
    mockPollingInterval = 0;
    mockTenant = {
        Name: database,
        Type: 'Dedicated',
        Overall: EFlag.Green,
        healthExpiresAt: 2000,
    } as TTenant & {healthExpiresAt: number};
    healthcheckResult = healthy;
    setup('alpha');
    await waitFor(() => expect(statusColor()).toHaveClass('ydb-status-color_state_green'));
    await waitFor(() => {
        const queries = store.getState()[healthcheckApi.reducerPath].queries;
        expect(Object.values(queries).some((query) => query?.status === 'fulfilled')).toBe(true);
    });
    expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(1000));

    expect(statusColor()).toHaveClass('ydb-status-color_state_grey');
    expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);
});

test('current Meta query failure overrides cached Viewer GOOD and recovers before expiry', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    mockMetaDatabasesAvailable = true;
    mockPollingInterval = 0;
    mockTenant = {
        Name: database,
        Type: 'Dedicated',
        Overall: EFlag.Green,
        healthExpiresAt: 121000,
    } as TTenant & {healthExpiresAt: number};
    healthcheckResult = healthy;
    const {rerender} = setup('alpha');
    await waitFor(() => {
        const queries = store.getState()[healthcheckApi.reducerPath].queries;
        expect(Object.values(queries).some((query) => query?.status === 'fulfilled')).toBe(true);
    });
    expect(statusColor()).toHaveClass('ydb-status-color_state_green');
    expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);

    mockTenantQueryError = {status: 400, statusText: 'Bad Request'};
    rerender();
    expect(statusColor()).toHaveClass('ydb-status-color_state_grey');
    expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);

    mockTenantQueryError = undefined;
    rerender();
    expect(statusColor()).toHaveClass('ydb-status-color_state_green');
    expect(getHealthcheckInfo).toHaveBeenCalledTimes(1);
});
