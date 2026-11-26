import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import {Router} from 'react-router-dom';
import {QueryParamProvider} from 'use-query-params';
import {ReactRouter5Adapter} from 'use-query-params/adapters/react-router-5';

import {configureStore} from '../../../../../store';
import {queryApi} from '../../../../../store/reducers/query/query';
import {setQueryAction} from '../../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {readSettingValueFromLS} from '../../../../../store/reducers/settings/utils';
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

test('Apply saves the changed settings and closes the dialog when the metrics counter throws', async () => {
    window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    });
    const track = jest.spyOn(metrica, 'reachMetricaGoal').mockImplementation(() => {
        throw new Error('Counter unavailable');
    });
    const storeConfiguration = configureStore();
    const {history, store} = storeConfiguration;
    await store.dispatch(
        queryApi.util.upsertQueryData('getResourcePools', {database: '/local'}, []),
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

    fireEvent.change(screen.getByRole('spinbutton', {name: 'Limit rows'}), {
        target: {value: '50000'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Apply'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(readSettingValueFromLS(SETTING_KEYS.QUERY_EXECUTION_SETTINGS)).toMatchObject({
        limitRows: 50000,
    });
    expect(track).toHaveBeenCalledWith(
        'applyQuerySettings',
        expect.objectContaining({limitRowsChanged: true, limitRows: 50000}),
    );
});
