import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {configureStore} from '@reduxjs/toolkit';
import {act, fireEvent, render, screen, within} from '@testing-library/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import type {YdbEmbeddedAPI} from '../../../services/api';
import {api} from '../../../store/reducers/api';
import {capabilitiesApi} from '../../../store/reducers/capabilities/capabilities';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import type {MetaCapabilitiesResponse} from '../../../types/api/capabilities';
import {EFlag} from '../../../types/api/enums';
import type {HealthCheckAPIResponse} from '../../../types/api/healthcheck';
import {SelfCheckResult, StatusFlag} from '../../../types/api/healthcheck';
import type {MetaViewerClusterInfo} from '../../../types/api/meta';
import {createAndDownloadJsonFile} from '../../../utils/downloadFile';
import {ClusterDrawerHealthcheck} from '../ClusterDrawerHealthcheck';

// Keep the real title, content, selectors and query adapters; omit portal/resize mechanics.
jest.mock('../../../components/Drawer', () => ({
    DrawerWrapper: ({
        title,
        renderDrawerContent,
        drawerControls,
    }: {
        title: React.ReactNode;
        renderDrawerContent: () => React.ReactNode;
        drawerControls: {key?: string; node?: React.ReactNode}[];
    }) => (
        <div role="dialog">
            {title}
            {drawerControls.map(({key, node}, index) => (
                <div key={key ?? index}>{node}</div>
            ))}
            {renderDrawerContent()}
        </div>
    ),
}));
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
const stores: ReturnType<typeof createStore>[] = [];

function createStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer, fullscreen: () => false},
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}).concat(api.middleware),
    });
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
                        <ClusterDrawerHealthcheck clusterName="alpha" isVisible onClose={jest.fn()}>
                            <span>Clusters</span>
                        </ClusterDrawerHealthcheck>
                    </QueryParamProvider>
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    await screen.findByRole('button', {name: 'Refresh'});
    return {store, getClustersList, getClusterHealth, getClusterInfo};
}

afterEach(() => {
    act(() => stores.splice(0).forEach((store) => store.dispatch(api.util.resetApiState())));
    window.api = originalApi;
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
        within(screen.getByRole('region', {name: 'Background monitoring'})).getByText(
            'Everything is working fine',
        ),
    ).toBeVisible();
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
    const stored = screen.getByRole('region', {name: 'Background monitoring'});
    expect(within(stored).getByText('Cluster is not monitored')).toBeVisible();
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
    expect(screen.queryByRole('region', {name: 'Background monitoring'})).not.toBeInTheDocument();
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
        within(screen.getByRole('region', {name: 'Background monitoring'})).getByText(
            'Everything is working fine',
        ),
    ).toBeVisible();
});

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
