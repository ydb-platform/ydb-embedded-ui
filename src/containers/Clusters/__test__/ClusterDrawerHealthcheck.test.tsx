import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {configureStore} from '@reduxjs/toolkit';
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {DrawerContextProvider} from '../../../components/Drawer/DrawerContext';
import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {capabilitiesApi} from '../../../store/reducers/capabilities/capabilities';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {healthcheckApi} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import settings from '../../../store/reducers/settings/settings';
import type {MetaCapabilitiesResponse} from '../../../types/api/capabilities';
import {EFlag} from '../../../types/api/enums';
import type {HealthCheckAPIResponse} from '../../../types/api/healthcheck';
import {SelfCheckResult, StatusFlag} from '../../../types/api/healthcheck';
import type {MetaViewerClusterInfo} from '../../../types/api/meta';
import {createAndDownloadJsonFile} from '../../../utils/downloadFile';
import {ClusterDrawerHealthcheck} from '../ClusterDrawerHealthcheck';

jest.mock('../../../components/Fullscreen/Fullscreen', () => ({
    Fullscreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../Tenant/useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        handleIssuesFilterChange: jest.fn(),
        handleHealthcheckViewChange: jest.fn(),
    }),
}));
jest.mock('../../../utils/downloadFile', () => ({createAndDownloadJsonFile: jest.fn()}));
jest.mock('../../../store', () => ({environment: ''}));

const originalApi = window.api;
const originalResizeObserver = window.ResizeObserver;
const stores: ReturnType<typeof createStore>[] = [];

function createStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer, fullscreen: () => false, settings},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(api.middleware),
    });
}

function DrawerFixture() {
    const [isVisible, setIsVisible] = React.useState(true);
    return (
        <DrawerContextProvider>
            <ClusterDrawerHealthcheck
                clusterName="alpha"
                isVisible={isVisible}
                onClose={() => setIsVisible(false)}
            >
                <button onClick={() => setIsVisible(true)}>Open healthcheck</button>
            </ClusterDrawerHealthcheck>
        </DrawerContextProvider>
    );
}

async function renderDrawer(
    current: MetaViewerClusterInfo | undefined,
    stored: HealthCheckAPIResponse,
    version = 2,
    currentQueryError?: unknown,
) {
    const getClustersList = jest
        .fn()
        .mockResolvedValue({clusters: current ? [{name: 'alpha', cluster: current}] : []});
    const getClusterHealth = jest.fn().mockResolvedValue(stored);
    const getClusterInfo = jest.fn();
    window.api = {
        meta: {getClustersList, getClusterHealth},
        viewer: {getClusterInfo},
    } as unknown as YdbEmbeddedAPI;
    const store = createStore();
    stores.push(store);
    await store.dispatch(
        capabilitiesApi.util.upsertQueryData('getMetaCapabilities', {}, {
            Capabilities: {'/meta/clusters': version, '/meta/cluster_health': version},
        } as MetaCapabilitiesResponse),
    );
    await store.dispatch(clustersApi.endpoints.getClustersList.initiate(undefined));
    if (currentQueryError) {
        getClustersList.mockRejectedValue(currentQueryError);
        await store.dispatch(
            clustersApi.endpoints.getClustersList.initiate(undefined, {forceRefetch: true}),
        );
    }
    render(
        <Provider store={store}>
            <ThemeProvider theme="light">
                <MemoryRouter>
                    <QueryParamProvider adapter={ReactRouter5Adapter}>
                        <DrawerFixture />
                    </QueryParamProvider>
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    await screen.findByRole('button', {name: 'Refresh'});
    return {store, getClustersList, getClusterHealth, getClusterInfo};
}

beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        width: 1024,
        height: 768,
        right: 1024,
        bottom: 768,
        toJSON() {},
    });
    window.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
});

afterEach(() => {
    act(() => stores.splice(0).forEach((store) => store.dispatch(api.util.resetApiState())));
    window.api = originalApi;
    window.ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

test('shows current Viewer failure separately from a fresh stored Good without another Viewer request', async () => {
    const requests = await renderDrawer(
        {Overall: EFlag.Grey, error: 'Viewer request timed out', status_ttl_ms: 0},
        {self_check_result: SelfCheckResult.GOOD, status_ttl_ms: 120000},
    );

    const current = screen.getByRole('group', {name: 'Current health'});
    expect(within(current).getByText('Unknown')).toBeVisible();
    expect(within(current).getByText('Viewer request timed out')).toBeVisible();
    expect(within(current).queryByText('Good')).not.toBeInTheDocument();
    expect(
        within(screen.getByRole('region', {name: 'Saved issues'})).getByText(
            'No saved issues available',
        ),
    ).toBeVisible();
    expect(screen.queryByText('Everything is working fine')).not.toBeInTheDocument();
    expect(requests.getClustersList).toHaveBeenCalledTimes(1);
    expect(requests.getClusterInfo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: /download healthcheck/i}));
    expect(createAndDownloadJsonFile).toHaveBeenCalledWith(
        expect.objectContaining({self_check_result: SelfCheckResult.GOOD}),
        expect.stringContaining('alpha-cluster-healthcheck-'),
    );
});

test('uses current Viewer status after monitoring is removed while retaining stored issues', async () => {
    const issue = {id: 'disk', type: 'STORAGE', status: StatusFlag.RED, message: 'Disk failure'};
    await renderDrawer(
        {Overall: EFlag.Green, overall_source: 'viewer', status_ttl_ms: 120000},
        {
            self_check_result: SelfCheckResult.UNSPECIFIED,
            error: 'Cluster is not monitored',
            status_ttl_ms: 0,
            issue_log: [issue],
        },
    );

    expect(
        within(screen.getByRole('group', {name: 'Current health'})).getByText('Good'),
    ).toBeVisible();
    const stored = screen.getByRole('region', {name: 'Saved issues'});
    expect(within(stored).getByText('Cluster is not monitored')).toBeVisible();
    expect(
        within(stored).getByText(
            'Previously reported issues. They may not reflect current health.',
        ),
    ).toBeVisible();
    expect(within(stored).queryByText('Unspecified')).not.toBeInTheDocument();
    expect(within(stored).queryByText(/\d+ (min|hour|day).* ago/)).not.toBeInTheDocument();
    expect(within(stored).getByRole('button', {name: 'Critical Disk failure'})).toBeVisible();
    fireEvent.click(screen.getByRole('button', {name: /download healthcheck/i}));
    expect(createAndDownloadJsonFile).toHaveBeenCalledWith(
        expect.objectContaining({
            issue_log: [issue],
            self_check_result: SelfCheckResult.UNSPECIFIED,
        }),
        expect.any(String),
    );
});

test('keeps the legacy drawer presentation when freshness capabilities are unavailable', async () => {
    await renderDrawer(
        {Overall: EFlag.Yellow, overall_source: 'viewer'},
        {self_check_result: SelfCheckResult.GOOD},
        1,
    );

    expect(screen.queryByRole('group', {name: 'Current health'})).not.toBeInTheDocument();
    expect(screen.queryByRole('region', {name: 'Saved issues'})).not.toBeInTheDocument();
    expect(screen.getAllByText('Everything is working fine')).toHaveLength(2);
    expect(screen.queryByText(/expired|freshness/i)).not.toBeInTheDocument();
});

test.each([
    {
        name: 'missing current data',
        current: undefined,
        error: undefined,
        reason: 'Current health is unavailable',
    },
    {
        name: 'failed current refresh without data',
        current: undefined,
        error: new Error('400 Bad Request'),
        reason: '400 Bad Request',
    },
])('does not substitute stored Good for $name', async ({current, error, reason}) => {
    await renderDrawer(
        current,
        {self_check_result: SelfCheckResult.GOOD, status_ttl_ms: 120000},
        2,
        error,
    );
    const currentHealth = screen.getByRole('group', {name: 'Current health'});
    expect(within(currentHealth).getByText('Unknown')).toBeVisible();
    expect(within(currentHealth).getByText(reason)).toBeVisible();
    expect(
        within(screen.getByRole('region', {name: 'Saved issues'})).getByText(
            'No saved issues available',
        ),
    ).toBeVisible();
    expect(screen.queryByText('Everything is working fine')).not.toBeInTheDocument();
});

test.each([
    {issueLog: []},
    {issueLog: [{id: 'disk', type: 'STORAGE', status: StatusFlag.RED, message: 'Disk failure'}]},
])('shows a shared failure once, retaining saved issues %j', async ({issueLog}) => {
    await renderDrawer(
        {Overall: EFlag.Grey, error: 'Health data expired', status_ttl_ms: 0},
        {
            self_check_result: SelfCheckResult.UNSPECIFIED,
            error: 'Health data expired',
            status_ttl_ms: 0,
            issue_log: issueLog,
        },
    );

    expect(screen.getAllByText('Unknown')).toHaveLength(1);
    expect(screen.getAllByText('Health data expired')).toHaveLength(1);
    const stored = screen.getByRole('region', {name: 'Saved issues'});
    expect(within(stored).queryByText('Unspecified')).not.toBeInTheDocument();
    if (issueLog.length) {
        expect(within(stored).getByRole('button', {name: 'Critical Disk failure'})).toBeVisible();
    } else {
        expect(within(stored).getByText('No saved issues available')).toBeVisible();
    }
});

test('refetches stored issues when the drawer is reopened without another Viewer request', async () => {
    const requests = await renderDrawer(
        {Overall: EFlag.Green, status_ttl_ms: 120000},
        {self_check_result: SelfCheckResult.GOOD, status_ttl_ms: 120000},
    );
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('button', {name: 'Refresh'})).not.toBeInTheDocument();
    requests.getClusterHealth.mockResolvedValue({
        self_check_result: SelfCheckResult.EMERGENCY,
        status_ttl_ms: 120000,
        issue_log: [
            {id: 'disk', type: 'STORAGE', status: StatusFlag.RED, message: 'New disk failure'},
        ],
    });

    fireEvent.click(await screen.findByRole('button', {name: 'Open healthcheck'}));
    expect(await screen.findByRole('button', {name: 'Critical New disk failure'})).toBeVisible();
    expect(requests.getClusterHealth).toHaveBeenCalledTimes(2);
    expect(requests.getClustersList).toHaveBeenCalledTimes(1);
    expect(requests.getClusterInfo).not.toHaveBeenCalled();
});

test.each(['400 Bad Request', 'Monitoring service is unavailable'])(
    'does not repeat the current failure after a stored refresh fails with %s',
    async (detail) => {
        const requests = await renderDrawer(
            {Overall: EFlag.Grey, error: '400 Bad Request', status_ttl_ms: 0},
            {
                self_check_result: SelfCheckResult.EMERGENCY,
                status_ttl_ms: 120000,
                issue_log: [
                    {id: 'disk', type: 'STORAGE', status: StatusFlag.RED, message: 'Disk failure'},
                ],
            },
        );
        requests.getClusterHealth.mockRejectedValue({
            isAxiosError: true,
            message: 'Request failed with status code 400',
            response: {
                status: 400,
                statusText: 'Bad Request',
                data: {error: detail},
                headers: {'x-request-id': 'stored-check-request'},
            },
        });
        fireEvent.click(screen.getByRole('button', {name: 'Refresh'}));
        const selectQuery = healthcheckApi.endpoints.getClusterHealthcheckInfo.select({
            clusterName: 'alpha',
        });
        await waitFor(() => expect(selectQuery(requests.store.getState()).isError).toBe(true));

        expect(screen.getAllByText('400 Bad Request')).toHaveLength(1);
        const stored = screen.getByRole('region', {name: 'Saved issues'});
        expect(within(stored).getByText('stored-check-request')).toBeVisible();
        if (detail !== '400 Bad Request') {
            expect(within(stored).getByText(detail)).toBeVisible();
        }
        expect(within(stored).getByRole('button', {name: 'Critical Disk failure'})).toBeVisible();
    },
);

test('preserves a fresh current observation after a list refresh fails, matching the list', async () => {
    await renderDrawer(
        {Overall: EFlag.Green, status_ttl_ms: 120000},
        {self_check_result: SelfCheckResult.GOOD, status_ttl_ms: 120000},
        2,
        new Error('400 Bad Request'),
    );
    const current = screen.getByRole('group', {name: 'Current health'});
    expect(within(current).getByText('Good')).toBeVisible();
    expect(within(current).queryByText('400 Bad Request')).not.toBeInTheDocument();
});
