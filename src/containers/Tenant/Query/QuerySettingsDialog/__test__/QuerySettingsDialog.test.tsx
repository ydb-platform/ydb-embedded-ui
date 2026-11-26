import {ThemeProvider} from '@gravity-ui/uikit';
import {act, fireEvent, screen, waitFor} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../../../store';
import {queryApi} from '../../../../../store/reducers/query/query';
import {setQueryAction} from '../../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {readSettingValueFromLS} from '../../../../../store/reducers/settings/utils';
import {DEFAULT_QUERY_SETTINGS, RESOURCE_POOL_NO_OVERRIDE_VALUE} from '../../../../../utils/query';
import {renderWithStore} from '../../../../../utils/tests/providers';
import * as metrica from '../../../../../utils/yaMetrica';
import {TenantContextProvider} from '../../../TenantContext';
import {QuerySettingsDialog} from '../QuerySettingsDialog';

const originalApi = window.api;
const originalMatchMedia = window.matchMedia;

afterEach(() => {
    jest.restoreAllMocks();
    window.api = originalApi;
    window.matchMedia = originalMatchMedia;
    localStorage.removeItem(SETTING_KEYS.QUERY_EXECUTION_SETTINGS);
});

async function renderSettingsDialog(resourcePools: string[] = []) {
    window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    });
    const storeConfiguration = configureStore();
    const {history, store} = storeConfiguration;
    await store.dispatch(
        queryApi.util.upsertQueryData('getResourcePools', {database: '/local'}, resourcePools),
    );
    store.dispatch(setQueryAction('settings'));

    renderWithStore(
        <ThemeProvider theme="light">
            <Router history={history}>
                <QueryParamProvider adapter={ReactRouter5Adapter}>
                    <TenantContextProvider
                        database="/local"
                        databaseFullPath="/local"
                        path="/local"
                    >
                        <QuerySettingsDialog />
                    </TenantContextProvider>
                </QueryParamProvider>
            </Router>
        </ThemeProvider>,
        {storeConfiguration},
    );
    return store;
}

async function applySettings() {
    fireEvent.click(screen.getByRole('button', {name: 'Apply'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

test('Apply saves the changed settings and closes the dialog when the metrics counter throws', async () => {
    const track = jest.spyOn(metrica, 'reachMetricaGoal').mockImplementation(() => {
        throw new Error('Counter unavailable');
    });
    await renderSettingsDialog();
    fireEvent.change(screen.getByRole('spinbutton', {name: 'Limit rows'}), {
        target: {value: '50000'},
    });
    await applySettings();

    expect(readSettingValueFromLS(SETTING_KEYS.QUERY_EXECUTION_SETTINGS)).toMatchObject({
        limitRows: 50000,
    });
    expect(track).toHaveBeenCalledWith(
        'applyQuerySettings',
        expect.objectContaining({limitRowsChanged: true, limitRows: 50000}),
    );
});

describe('when the saved resource pool becomes unavailable', () => {
    beforeEach(async () => {
        localStorage.setItem(
            SETTING_KEYS.QUERY_EXECUTION_SETTINGS,
            JSON.stringify({...DEFAULT_QUERY_SETTINGS, resourcePool: 'old-pool'}),
        );
        const store = await renderSettingsDialog(['old-pool', 'available-pool']);
        const pool = screen.getByRole('combobox', {name: 'Resource pool'});
        expect(pool).toHaveTextContent('old-pool');
        act(() => {
            store.dispatch(
                queryApi.util.updateQueryData('getResourcePools', {database: '/local'}, () => [
                    'available-pool',
                ]),
            );
        });
        await waitFor(() => expect(pool).toHaveTextContent('No pool override'));
    });

    test('Apply without edits sends no analytics event', async () => {
        const track = jest.spyOn(metrica, 'reachMetricaGoal').mockImplementation(() => {});
        await applySettings();

        expect(track).not.toHaveBeenCalled();
        expect(readSettingValueFromLS(SETTING_KEYS.QUERY_EXECUTION_SETTINGS)).toMatchObject({
            resourcePool: RESOURCE_POOL_NO_OVERRIDE_VALUE,
        });
    });

    test('Apply after editing Limit rows records only limitRowsChanged', async () => {
        const track = jest.spyOn(metrica, 'reachMetricaGoal').mockImplementation(() => {});
        fireEvent.change(screen.getByRole('spinbutton', {name: 'Limit rows'}), {
            target: {value: '50000'},
        });
        await applySettings();

        expect(track).toHaveBeenCalledTimes(1);
        const [[goal, params]] = track.mock.calls;
        expect(goal).toBe('applyQuerySettings');
        expect(params).toMatchObject({limitRows: 50000, resourcePoolOverride: false});
        expect(Object.keys(params ?? {}).filter((key) => key.endsWith('Changed'))).toEqual([
            'limitRowsChanged',
        ]);
    });
});
