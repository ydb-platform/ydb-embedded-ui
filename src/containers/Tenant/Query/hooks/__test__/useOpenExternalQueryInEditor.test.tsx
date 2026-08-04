import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {act, renderHook, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';

import type {YdbEmbeddedAPI} from '../../../../../services/api';
import {configureStore} from '../../../../../store';
import {
    changeUserInput,
    selectActiveTabId,
    selectIsDirty,
    selectResult,
    selectTabsById,
    selectTabsOrder,
    selectUserInput,
    setIsDirty,
    setLastExecutedQueryText,
    setQueryResult,
} from '../../../../../store/reducers/query/query';
import {configureUIFactory} from '../../../../../uiFactory/uiFactory';
import createToast from '../../../../../utils/createToast';
import {RUNNING_QUERY_DIALOG} from '../../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {UNSAVED_CHANGES_DIALOG} from '../../../../../utils/hooks/withConfirmation/UnsavedChangesDialog';
import {queryExecutionManagerInstance} from '../../QueryEditor/utils/queryExecutionManager';
import {useOpenExternalQueryInEditor} from '../useOpenExternalQueryInEditor';

jest.mock('../../../../../utils/createToast');

const originalApi = window.api;
const sendQuery = jest.fn();

function renderOpenExternalQueryHook({
    isMultiTabEnabled = false,
    dirtyInput,
    runningInput,
    isStreaming = false,
    initialLocation = '/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics',
}: {
    isMultiTabEnabled?: boolean;
    dirtyInput?: string;
    runningInput?: string;
    isStreaming?: boolean;
    initialLocation?: string;
} = {}) {
    configureUIFactory({enableMultiTabQueryEditor: isMultiTabEnabled});
    const {history, store} = configureStore();
    window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
    history.push(initialLocation);
    const activeTabId = selectActiveTabId(store.getState());
    if (!activeTabId) {
        throw new Error('Expected an active query tab');
    }

    if (runningInput !== undefined) {
        store.dispatch(changeUserInput({input: runningInput}));
        store.dispatch(setLastExecutedQueryText({tabId: activeTabId, queryText: runningInput}));
        store.dispatch(setIsDirty(false));
        const runningResultBase = {
            executionId: 'running-execution',
            type: 'execute' as const,
            queryId: 'running-query',
            isLoading: true,
            startTime: 1,
        };
        const runningResult = isStreaming
            ? {...runningResultBase, streamingStatus: 'running' as const}
            : runningResultBase;
        store.dispatch(
            setQueryResult({
                tabId: activeTabId,
                result: runningResult,
            }),
        );
    }

    if (dirtyInput !== undefined) {
        if (runningInput === undefined) {
            store.dispatch(changeUserInput({input: 'SELECT saved;'}));
            store.dispatch(setIsDirty(false));
        }
        store.dispatch(changeUserInput({input: dirtyInput}));
    }

    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>
            <Router history={history}>{children}</Router>
        </Provider>
    );

    return {
        activeTabId,
        history,
        store,
        ...renderHook(() => useOpenExternalQueryInEditor(), {wrapper}),
    };
}

function registerRunningQuery(tabId: string, database = '/Root/db') {
    const abort = jest.fn();
    const query = Object.assign(new Promise<never>(() => undefined), {abort});
    queryExecutionManagerInstance.registerQuery(tabId, query, database);
    return abort;
}

function getSearchParam(search: string, name: string) {
    return new URLSearchParams(search).get(name);
}

function createDeferred<T>() {
    let resolvePromise: (value: T) => void = () => undefined;
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve;
    });
    return {promise, resolve: resolvePromise};
}

describe('useOpenExternalQueryInEditor', () => {
    const showModal = jest.spyOn(NiceModal, 'show');

    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        sendQuery.mockReset();
        sendQuery.mockResolvedValue({});
        jest.mocked(createToast).mockClear();
        showModal.mockReset();
    });

    afterEach(() => {
        queryExecutionManagerInstance.abortAll();
    });

    afterAll(() => {
        window.api = originalApi;
        showModal.mockRestore();
        configureUIFactory({enableMultiTabQueryEditor: false});
    });

    test('navigates from another tenant page to the new-query editor', async () => {
        const {history, result, store} = renderOpenExternalQueryHook({isMultiTabEnabled: true});

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;'});
        });

        expect(selectUserInput(store.getState())).toBe('SELECT 1;');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(getSearchParam(history.location.search, 'queryTab')).toBe('newQuery');
    });

    test('does not push a duplicate history entry when already on the Query page', async () => {
        const {history, result} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            initialLocation: '/database?database=%2FRoot%2Fdb&databasePage=query&queryTab=saved',
        });
        const push = jest.spyOn(history, 'push');

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;'});
        });

        expect(push).not.toHaveBeenCalled();
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(getSearchParam(history.location.search, 'queryTab')).toBe('newQuery');
    });

    test('preserves the environment prefix when already on the Query page', async () => {
        const {history, result} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            initialLocation:
                '/cloud-prod/database?database=%2FRoot%2Fdb&databasePage=query&queryTab=saved',
        });
        const push = jest.spyOn(history, 'push');

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;'});
        });

        expect(push).not.toHaveBeenCalled();
        expect(history.location.pathname).toBe('/cloud-prod/database');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(getSearchParam(history.location.search, 'queryTab')).toBe('newQuery');
    });

    test('does not change query state or navigate without a selected database', async () => {
        const onAfterOpen = jest.fn();
        const {history, result, store} = renderOpenExternalQueryHook({
            dirtyInput: 'SELECT unsaved;',
            initialLocation: '/home',
        });

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;', onAfterOpen});
        });

        expect(showModal).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT unsaved;');
        expect(selectIsDirty(store.getState())).toBe(true);
        expect(history.location.pathname).toBe('/home');
        expect(history.location.search).toBe('');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('navigates from a non-database route with retained Query page params', async () => {
        const {history, result} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            initialLocation: '/cluster?database=%2FRoot%2Fdb&databasePage=query',
        });

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;'});
        });

        expect(history.location.pathname).toBe('/database');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(getSearchParam(history.location.search, 'queryTab')).toBe('newQuery');
    });

    test('opens from a legacy database name parameter before URL migration', async () => {
        const {history, result, store} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            initialLocation: '/database?name=%2FRoot%2Fdb&databasePage=diagnostics',
        });

        await act(async () => {
            await result.current({title: 'Select query', input: 'SELECT 1;'});
        });

        expect(selectUserInput(store.getState())).toBe('SELECT 1;');
        expect(getSearchParam(history.location.search, 'database')).toBe('/Root/db');
        expect(getSearchParam(history.location.search, 'name')).toBeNull();
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(getSearchParam(history.location.search, 'queryTab')).toBe('newQuery');
    });

    test('keeps a dirty single-tab query when replacement is cancelled', async () => {
        const onAfterOpen = jest.fn();
        const {history, result, store} = renderOpenExternalQueryHook({
            dirtyInput: 'SELECT unsaved;',
        });
        showModal.mockResolvedValue(false as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        expect(showModal).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT unsaved;');
        expect(selectIsDirty(store.getState())).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('confirms replacement of a dirty single-tab query with empty input', async () => {
        const onAfterOpen = jest.fn();
        const {history, result, store} = renderOpenExternalQueryHook({dirtyInput: ''});
        showModal.mockResolvedValue(false as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        expect(showModal).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('');
        expect(selectIsDirty(store.getState())).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('replaces a dirty single-tab query after confirmation', async () => {
        const onAfterOpen = jest.fn();
        const {history, result, store} = renderOpenExternalQueryHook({
            dirtyInput: 'SELECT unsaved;',
        });
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        expect(showModal).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT replacement;');
        expect(selectIsDirty(store.getState())).toBe(false);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
        expect(onAfterOpen).toHaveBeenCalledTimes(1);
    });

    test('keeps a running single-tab query when stopping it is cancelled', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        showModal.mockResolvedValue(false as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT running;');
        expect(selectResult(store.getState())?.isLoading).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('cancels a non-streaming query on the server before replacing it', async () => {
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;'});
        });

        await waitFor(() => {
            expect(abort).toHaveBeenCalledTimes(1);
        });
        expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        expect(sendQuery).toHaveBeenCalledWith(
            {
                action: 'cancel-query',
                database: '/Root/db',
                internal_call: true,
                query_id: 'running-query',
            },
            {signal: expect.any(AbortSignal)},
        );
        expect(sendQuery.mock.invocationCallOrder[0]).toBeLessThan(
            abort.mock.invocationCallOrder[0],
        );
        expect(abort).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT replacement;');
        expect(selectResult(store.getState())).toBeUndefined();
    });

    test('cancels a non-streaming query against its originating database', async () => {
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId, '/Root/db');
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            history.push('/database?database=%2FRoot%2Fother&databasePage=diagnostics');
        });
        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;'});
        });

        await waitFor(() => {
            expect(abort).toHaveBeenCalledTimes(1);
        });
        expect(sendQuery).toHaveBeenCalledWith(
            {
                action: 'cancel-query',
                database: '/Root/db',
                internal_call: true,
                query_id: 'running-query',
            },
            {signal: expect.any(AbortSignal)},
        );
        expect(selectUserInput(store.getState())).toBe('SELECT replacement;');
        expect(getSearchParam(history.location.search, 'database')).toBe('/Root/other');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('query');
    });

    test('does not open against a stale route after server cancellation', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        const cancelResponse = createDeferred<{}>();
        sendQuery.mockReturnValue(cancelResponse.promise);
        showModal.mockResolvedValue(true as never);

        act(() => {
            result.current({
                title: 'Replacement',
                input: 'SELECT replacement;',
                onAfterOpen,
            });
        });

        await waitFor(() => {
            expect(sendQuery).toHaveBeenCalledTimes(1);
        });
        await act(async () => {
            history.push('/database?database=%2FRoot%2Fother&databasePage=diagnostics');
        });
        await act(async () => {
            cancelResponse.resolve({});
            await cancelResponse.promise;
        });

        expect(abort).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT running;');
        expect(getSearchParam(history.location.search, 'database')).toBe('/Root/other');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('keeps a non-streaming query when server cancellation fails', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        sendQuery.mockRejectedValue(new Error('Unable to cancel query'));
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        await waitFor(() => {
            expect(sendQuery).toHaveBeenCalledTimes(1);
        });
        expect(sendQuery).toHaveBeenCalledTimes(1);
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT running;');
        expect(selectResult(store.getState())?.isLoading).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
        expect(createToast).toHaveBeenCalledWith(
            expect.objectContaining({name: 'stop-error', theme: 'danger'}),
        );
    });

    test('stops a streaming query locally before replacing it', async () => {
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
            isStreaming: true,
        });
        const abort = registerRunningQuery(activeTabId);
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;'});
        });

        expect(sendQuery).not.toHaveBeenCalled();
        expect(abort).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT replacement;');
        expect(selectResult(store.getState())).toBeUndefined();
    });

    test('does not stop a running query when dirty replacement is cancelled', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
            dirtyInput: 'SELECT edited while running;',
        });
        const abort = registerRunningQuery(activeTabId);
        showModal.mockResolvedValueOnce(true as never).mockResolvedValueOnce(false as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;', onAfterOpen});
        });

        expect(showModal).toHaveBeenNthCalledWith(1, RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        expect(showModal).toHaveBeenNthCalledWith(2, UNSAVED_CHANGES_DIALOG, {
            id: UNSAVED_CHANGES_DIALOG,
        });
        expect(sendQuery).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT edited while running;');
        expect(selectResult(store.getState())?.isLoading).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('rechecks dirty state after confirming a running query', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        const runningConfirmation = createDeferred<boolean>();
        showModal
            .mockReturnValueOnce(runningConfirmation.promise as never)
            .mockResolvedValueOnce(false as never);

        act(() => {
            result.current({
                title: 'Replacement',
                input: 'SELECT replacement;',
                onAfterOpen,
            });
        });

        await act(async () => {
            store.dispatch(changeUserInput({input: 'SELECT edited while confirming;'}));
        });
        await act(async () => {
            runningConfirmation.resolve(true);
            await runningConfirmation.promise;
        });

        expect(showModal).toHaveBeenNthCalledWith(1, RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        expect(showModal).toHaveBeenNthCalledWith(2, UNSAVED_CHANGES_DIALOG, {
            id: UNSAVED_CHANGES_DIALOG,
        });
        expect(sendQuery).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT edited while confirming;');
        expect(selectResult(store.getState())?.isLoading).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('does not stop a different query started during running-query confirmation', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT first;',
        });
        registerRunningQuery(activeTabId);
        const runningConfirmation = createDeferred<boolean>();
        showModal.mockReturnValueOnce(runningConfirmation.promise as never);

        act(() => {
            result.current({
                title: 'Replacement',
                input: 'SELECT replacement;',
                onAfterOpen,
            });
        });

        await waitFor(() => {
            expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
                id: RUNNING_QUERY_DIALOG,
            });
        });
        const nextQuery = 'SELECT second;';
        const nextQueryAbort = registerRunningQuery(activeTabId);
        const nextResult = {
            executionId: 'next-execution',
            type: 'execute' as const,
            queryId: 'next-query',
            isLoading: true,
            startTime: 2,
        };
        await act(async () => {
            store.dispatch(changeUserInput({input: nextQuery}));
            store.dispatch(setLastExecutedQueryText({tabId: activeTabId, queryText: nextQuery}));
            store.dispatch(setIsDirty(false));
            store.dispatch(
                setQueryResult({
                    tabId: activeTabId,
                    result: nextResult,
                }),
            );
        });
        await act(async () => {
            runningConfirmation.resolve(true);
            await runningConfirmation.promise;
        });

        expect(sendQuery).not.toHaveBeenCalled();
        expect(nextQueryAbort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe(nextQuery);
        expect(selectResult(store.getState())?.queryId).toBe('next-query');
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('does not open after leaving the database during running-query confirmation', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        const runningConfirmation = createDeferred<boolean>();
        showModal.mockReturnValueOnce(runningConfirmation.promise as never);

        act(() => {
            result.current({
                title: 'Replacement',
                input: 'SELECT replacement;',
                onAfterOpen,
            });
        });

        await waitFor(() => {
            expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
                id: RUNNING_QUERY_DIALOG,
            });
        });
        await act(async () => {
            history.push('/home');
            store.dispatch(setQueryResult({tabId: activeTabId, result: undefined}));
        });
        await act(async () => {
            runningConfirmation.resolve(true);
            await runningConfirmation.promise;
        });

        expect(sendQuery).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT running;');
        expect(history.location.pathname).toBe('/home');
        expect(history.location.search).toBe('');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('does not overwrite edits made while server cancellation is pending', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, history, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        const cancelResponse = createDeferred<{}>();
        sendQuery.mockReturnValue(cancelResponse.promise);
        showModal.mockResolvedValue(true as never);

        act(() => {
            result.current({
                title: 'Replacement',
                input: 'SELECT replacement;',
                onAfterOpen,
            });
        });

        await waitFor(() => {
            expect(sendQuery).toHaveBeenCalledTimes(1);
        });
        await act(async () => {
            store.dispatch(changeUserInput({input: 'SELECT edited while stopping;'}));
        });
        await act(async () => {
            cancelResponse.resolve({});
            await cancelResponse.promise;
        });

        expect(abort).toHaveBeenCalledTimes(1);
        expect(selectUserInput(store.getState())).toBe('SELECT edited while stopping;');
        expect(selectIsDirty(store.getState())).toBe(true);
        expect(getSearchParam(history.location.search, 'databasePage')).toBe('diagnostics');
        expect(onAfterOpen).not.toHaveBeenCalled();
    });

    test('opens a new tab without stopping a running query when multi-tab is enabled', async () => {
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;'});
        });

        const state = store.getState();
        expect(showModal).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectTabsOrder(state)).toHaveLength(2);
        expect(selectTabsById(state)[activeTabId].input).toBe('SELECT running;');
        expect(selectTabsById(state)[activeTabId].result?.isLoading).toBe(true);
        expect(selectUserInput(state)).toBe('SELECT replacement;');
    });
});
