import {ThemeProvider} from '@gravity-ui/uikit';
import {configureStore} from '@reduxjs/toolkit';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';

import type {YdbEmbeddedAPI} from '../../../../../services/api';
import {api} from '../../../../../store/reducers/api';
import type {QueryPlan} from '../../../../../types/api/query';
import {downloadFile} from '../../../../../utils/downloadFile';
import {ExecutionPlan} from '../components/ExecutionPlan/ExecutionPlan';

jest.mock('../../../../../utils/downloadFile', () => ({downloadFile: jest.fn()}));

const firstPlan: QueryPlan = {meta: {version: '0.2', type: 'query'}, Plan: {'Node Type': 'first'}};
const secondPlan: QueryPlan = {
    meta: {version: '0.2', type: 'query'},
    Plan: {'Node Type': 'second'},
};
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" />';

function createTestStore() {
    return configureStore({
        reducer: {[api.reducerPath]: api.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });
}

let store: ReturnType<typeof createTestStore>;
let convert: jest.Mock;
const originalApi = window.api;
const originalCreateUrl = URL.createObjectURL;
const originalRevokeUrl = URL.revokeObjectURL;

beforeEach(() => {
    store = createTestStore();
    convert = jest.fn().mockResolvedValue(svg);
    window.api = {viewer: {planToSvg: convert}} as unknown as YdbEmbeddedAPI;
    URL.createObjectURL = jest.fn().mockReturnValue('blob:plan');
    URL.revokeObjectURL = jest.fn();
    jest.mocked(downloadFile).mockClear();
});
afterEach(() => {
    act(() => {
        store.dispatch(api.util.resetApiState());
    });
    window.api = originalApi;
    URL.createObjectURL = originalCreateUrl;
    URL.revokeObjectURL = originalRevokeUrl;
});

function panel(plan?: QueryPlan, database = '/local') {
    return (
        <Provider store={store}>
            <ThemeProvider theme="light">
                <ExecutionPlan plan={plan} database={database} />
            </ThemeProvider>
        </Provider>
    );
}

test('skips conversion without a plan', () => {
    render(panel());
    expect(screen.getByText('There is no execution plan for this query')).toBeVisible();
    expect(convert).not.toHaveBeenCalled();
});

test('downloads the displayed Blob, revokes it and reuses cached SVG after remount', async () => {
    const view = render(panel(firstPlan));
    await screen.findByRole('img', {name: 'Execution Plan'});
    fireEvent.click(screen.getByRole('button', {name: 'Download .SVG'}));
    expect(downloadFile).toHaveBeenCalledWith('blob:plan', 'query-plan.svg');
    expect(convert).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:plan');
    const next = render(panel(firstPlan));
    await screen.findByRole('img', {name: 'Execution Plan'});
    expect(convert).toHaveBeenCalledTimes(1);
    next.unmount();
});

test('ignores a previous plan response after switching database and plan', async () => {
    let resolveOld!: (value: string) => void;
    convert.mockImplementationOnce(
        () =>
            new Promise<string>((resolve) => {
                resolveOld = resolve;
            }),
    );
    const view = render(panel(firstPlan));
    await waitFor(() => expect(convert).toHaveBeenCalledTimes(1));
    view.rerender(panel(secondPlan, '/other'));
    await screen.findByRole('img', {name: 'Execution Plan'});
    expect(convert.mock.calls[1][0]).toEqual({database: '/other', plan: secondPlan});
    await act(async () => {
        resolveOld('<svg>old</svg>');
    });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:plan');
    view.unmount();
});

test('retries a conversion failure and a failed image load', async () => {
    convert.mockRejectedValueOnce('Conversion failed');
    const view = render(panel(firstPlan));
    fireEvent.click(await screen.findByRole('button', {name: 'Retry'}));
    fireEvent.error(await screen.findByRole('img', {name: 'Execution Plan'}));
    expect(screen.getByText('The execution plan could not be displayed')).toBeVisible();
    URL.createObjectURL = jest.fn().mockReturnValue('blob:retry');
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:retry'));
    expect(convert).toHaveBeenCalledTimes(3);
    view.unmount();
});
