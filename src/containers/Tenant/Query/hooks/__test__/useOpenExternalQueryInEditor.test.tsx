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
const replacement = {title: 'Replacement', input: 'SELECT replacement;'};
const databaseParam = 'database=%2FRoot%2Fdb';
const canonicalRoute = `/tenant?${databaseParam}&databasePage=diagnostics`;
// prettier-ignore
const routeCases: Array<[string, string, string, string?, string?]> = [
    ['canonical tenant route', canonicalRoute, '/database', undefined, undefined],
    ['already on Query without a duplicate push', `/database?${databaseParam}&databasePage=query&queryTab=saved`, '/database', 'no-push', undefined],
    ['environment route', `/cloud-prod/node/1?${databaseParam}&databasePage=query`, '/cloud-prod/database', undefined, undefined],
    ['extension route', `/cloud-prod/custom?${databaseParam}`, '/cloud-prod/database', 'extension', undefined],
    ['legacy name normalization', '/database?name=%2FRoot%2Fdb&databasePage=diagnostics', '/database', undefined, `/database?${databaseParam}&databasePage=diagnostics`],
    ['legacy tenant page normalization', `/database?${databaseParam}&tenantPage=diagnostics`, '/database', undefined, `/database?${databaseParam}&databasePage=diagnostics`],
];
type TestStore = ReturnType<typeof configureStore>['store'];
// prettier-ignore
type ExecutionOptions = {input: string; queryId?: string; startTime?: number; isLoading?: boolean; streamingStatus?: 'preparing' | 'running'};
function setExecution(store: TestStore, tabId: string, options: ExecutionOptions) {
    const {
        input,
        queryId = 'running-query',
        startTime = 1,
        isLoading = true,
        streamingStatus,
    } = options;
    store.dispatch(changeUserInput({input}));
    store.dispatch(setLastExecutedQueryText({tabId, queryText: input}));
    store.dispatch(setIsDirty(false));
    // prettier-ignore
    store.dispatch(setQueryResult({tabId, result: {
        executionId: `execution-${startTime}`, type: 'execute', queryId, isLoading, startTime,
        ...(streamingStatus ? {streamingStatus} : {}),
    }}));
}
function updateExecution(store: TestStore, tabId: string, options: ExecutionOptions) {
    act(() => setExecution(store, tabId, options));
}
// prettier-ignore
type HookOptions = {isMultiTabEnabled?: boolean; dirtyInput?: string; runningInput?: string; isStreaming?: boolean; initialLocation?: string; environments?: string[]; singleClusterMode?: boolean};
function renderOpenExternalQueryHook(options: HookOptions = {}) {
    const {
        isMultiTabEnabled = false,
        dirtyInput,
        runningInput,
        isStreaming = false,
        initialLocation = canonicalRoute,
        environments,
        singleClusterMode,
    } = options;
    configureUIFactory({enableMultiTabQueryEditor: isMultiTabEnabled});
    const {history, store} = configureStore({environments, singleClusterMode});
    window.api = {viewer: {sendQuery}} as unknown as YdbEmbeddedAPI;
    history.push(initialLocation);
    const activeTabId = selectActiveTabId(store.getState());
    if (!activeTabId) {
        throw new Error('Expected an active query tab');
    }
    if (runningInput !== undefined) {
        setExecution(store, activeTabId, {
            input: runningInput,
            streamingStatus: isStreaming ? 'running' : undefined,
        });
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
        wrapper,
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
    let rejectPromise: (reason?: unknown) => void = () => undefined;
    const promise = new Promise<T>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });
    return {promise, reject: rejectPromise, resolve: resolvePromise};
}
function openQuery(
    result: {current: ReturnType<typeof useOpenExternalQueryInEditor>},
    input = replacement.input,
    onAfterOpen?: () => void,
) {
    result.current({title: 'Replacement', input, onAfterOpen});
}
async function resolveDeferred<T>(deferred: ReturnType<typeof createDeferred<T>>, value: T) {
    await act(async () => {
        deferred.resolve(value);
        await deferred.promise;
    });
}
function editQuery(store: TestStore, input: string) {
    act(() => store.dispatch(changeUserInput({input})));
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
    afterEach(() => queryExecutionManagerInstance.abortAll());
    afterAll(() => {
        window.api = originalApi;
        showModal.mockRestore();
        configureUIFactory({enableMultiTabQueryEditor: false});
    });
    test.each(routeCases)(
        'opens on the Query route from %s',
        async (_name, initialLocation, expectedPath, mode, normalizedLocation) => {
            const hook = renderOpenExternalQueryHook({
                dirtyInput: normalizedLocation ? 'SELECT unsaved;' : undefined,
                environments: mode === 'extension' ? ['cloud-prod'] : undefined,
                initialLocation,
                isMultiTabEnabled: !normalizedLocation,
                singleClusterMode: mode === 'extension' ? false : undefined,
            });
            const push = jest.spyOn(hook.history, 'push');
            const onAfterOpen = jest.fn();
            if (normalizedLocation) {
                const confirmation = createDeferred<boolean>();
                showModal.mockReturnValueOnce(confirmation.promise as never);
                act(() => openQuery(hook.result, replacement.input, onAfterOpen));
                await waitFor(() => expect(showModal).toHaveBeenCalled());
                act(() => hook.history.replace(normalizedLocation));
                await resolveDeferred(confirmation, true);
            } else {
                await act(async () => openQuery(hook.result, replacement.input, onAfterOpen));
            }
            expect(hook.history.location.pathname).toBe(expectedPath);
            expect(getSearchParam(hook.history.location.search, 'database')).toBe('/Root/db');
            expect(getSearchParam(hook.history.location.search, 'name')).toBeNull();
            expect(getSearchParam(hook.history.location.search, 'databasePage')).toBe('query');
            expect(getSearchParam(hook.history.location.search, 'queryTab')).toBe('newQuery');
            expect(selectUserInput(hook.store.getState())).toBe(replacement.input);
            expect(onAfterOpen).toHaveBeenCalledTimes(1);
            if (mode === 'no-push') {
                expect(push).not.toHaveBeenCalled();
            }
        },
    );
    test('does nothing without a selected database', async () => {
        const onAfterOpen = jest.fn();
        const {history, result, store} = renderOpenExternalQueryHook({
            dirtyInput: 'SELECT unsaved;',
            initialLocation: '/home',
        });
        await act(async () => openQuery(result, replacement.input, onAfterOpen));
        expect(showModal).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT unsaved;');
        expect(selectIsDirty(store.getState())).toBe(true);
        expect(history.location).toMatchObject({pathname: '/home', search: ''});
        expect(onAfterOpen).not.toHaveBeenCalled();
    });
    test.each([
        ['non-empty cancel', 'SELECT unsaved;', false, 'SELECT unsaved;', 'diagnostics'],
        ['empty cancel', '', false, '', 'diagnostics'],
        ['accept', 'SELECT unsaved;', true, replacement.input, 'query'],
    ])(
        'handles dirty confirmation: %s',
        async (_name, dirtyInput, confirmed, expectedInput, expectedPage) => {
            const onAfterOpen = jest.fn();
            const {history, result, store} = renderOpenExternalQueryHook({dirtyInput});
            showModal.mockResolvedValue(confirmed as never);
            await act(async () => openQuery(result, replacement.input, onAfterOpen));
            expect(showModal).toHaveBeenCalledWith(UNSAVED_CHANGES_DIALOG, {
                id: UNSAVED_CHANGES_DIALOG,
            });
            expect(selectUserInput(store.getState())).toBe(expectedInput);
            expect(selectIsDirty(store.getState())).toBe(!confirmed);
            expect(getSearchParam(history.location.search, 'databasePage')).toBe(expectedPage);
            expect(onAfterOpen).toHaveBeenCalledTimes(confirmed ? 1 : 0);
        },
    );
    test('confirms a query started during dirty confirmation as running', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            dirtyInput: 'SELECT unsaved;',
        });
        const dirtyConfirmation = createDeferred<boolean>();
        showModal
            .mockReturnValueOnce(dirtyConfirmation.promise as never)
            .mockResolvedValueOnce(false as never);
        act(() => openQuery(result, replacement.input, onAfterOpen));
        await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
        const runningInput = 'SELECT started while confirming;';
        const abort = registerRunningQuery(activeTabId);
        updateExecution(store, activeTabId, {
            input: runningInput,
            queryId: 'late-query',
            startTime: 2,
        });
        await resolveDeferred(dirtyConfirmation, true);
        await waitFor(() =>
            expect(showModal).toHaveBeenNthCalledWith(2, RUNNING_QUERY_DIALOG, {
                id: RUNNING_QUERY_DIALOG,
            }),
        );
        expect(sendQuery).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe(runningInput);
        expect(onAfterOpen).not.toHaveBeenCalled();
    });
    test.each([
        ['cancel preserves the query', 'cancel'],
        ['accept cancels the originating database before opening', 'accept'],
        ['dirty running query rejects later dirty confirmation', 'dirty'],
        ['edit during running confirmation rejects dirty confirmation', 'edit'],
    ])('handles running confirmation: %s', async (_name, mode) => {
        const onAfterOpen = jest.fn();
        const dirtyInput = mode === 'dirty' ? 'SELECT edited while running;' : undefined;
        const hook = renderOpenExternalQueryHook({
            dirtyInput,
            runningInput: 'SELECT running;',
        });
        const executionDatabase = mode === 'accept' ? '/Root/origin' : '/Root/db';
        const abort = registerRunningQuery(hook.activeTabId, executionDatabase);
        const runningConfirmation = createDeferred<boolean>();
        if (mode === 'edit') {
            showModal
                .mockReturnValueOnce(runningConfirmation.promise as never)
                .mockResolvedValueOnce(false as never);
            act(() => openQuery(hook.result, replacement.input, onAfterOpen));
            await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
            editQuery(hook.store, 'SELECT edited while confirming;');
            await resolveDeferred(runningConfirmation, true);
        } else {
            showModal
                .mockResolvedValueOnce((mode !== 'cancel') as never)
                .mockResolvedValueOnce(false as never);
            await act(async () => openQuery(hook.result, replacement.input, onAfterOpen));
        }
        expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        const shouldCancel = mode === 'accept';
        expect(abort).toHaveBeenCalledTimes(shouldCancel ? 1 : 0);
        expect(sendQuery).toHaveBeenCalledTimes(shouldCancel ? 1 : 0);
        const expectedInput =
            dirtyInput ?? (mode === 'edit' ? 'SELECT edited while confirming;' : 'SELECT running;');
        expect(selectUserInput(hook.store.getState())).toBe(
            shouldCancel ? replacement.input : expectedInput,
        );
        expect(onAfterOpen).toHaveBeenCalledTimes(shouldCancel ? 1 : 0);
        if (mode === 'dirty' || mode === 'edit') {
            expect(showModal).toHaveBeenNthCalledWith(2, UNSAVED_CHANGES_DIALOG, {
                id: UNSAVED_CHANGES_DIALOG,
            });
        }
        if (shouldCancel) {
            expect(sendQuery).toHaveBeenCalledWith(
                {
                    action: 'cancel-query',
                    database: executionDatabase,
                    internal_call: true,
                    query_id: 'running-query',
                },
                {signal: expect.any(AbortSignal)},
            );
            expect(sendQuery.mock.invocationCallOrder[0]).toBeLessThan(
                abort.mock.invocationCallOrder[0],
            );
        }
    });
    test.each([
        ['same execution shows a toast and stays open', false],
        ['finished execution opens without a toast', true],
    ])('handles cancellation rejection: %s', async (_name, finishExecution) => {
        const onAfterOpen = jest.fn();
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        const cancellation = createDeferred<{}>();
        sendQuery.mockReturnValue(cancellation.promise);
        showModal.mockResolvedValue(true as never);
        act(() => openQuery(result, replacement.input, onAfterOpen));
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
        await act(async () => {
            if (finishExecution) {
                updateExecution(store, activeTabId, {
                    input: 'SELECT running;',
                    isLoading: false,
                });
            }
            cancellation.reject({status: 'CUSTOM_ERROR', error: 'Unable to cancel query'});
            await cancellation.promise.catch(() => undefined);
        });
        await waitFor(() =>
            expect(selectUserInput(store.getState())).toBe(
                finishExecution ? replacement.input : 'SELECT running;',
            ),
        );
        expect(abort).toHaveBeenCalledTimes(finishExecution ? 1 : 0);
        expect(createToast).toHaveBeenCalledTimes(finishExecution ? 0 : 1);
        expect(onAfterOpen).toHaveBeenCalledTimes(finishExecution ? 1 : 0);
    });
    test.each([
        ['immediately', false],
        ['after its query ID arrives while confirmation is pending', true],
    ])('aborts a streaming execution locally %s', async (_name, queryIdArrives) => {
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            isStreaming: true,
            runningInput: 'SELECT streaming;',
        });
        const abort = registerRunningQuery(activeTabId);
        const confirmation = createDeferred<boolean>();
        if (queryIdArrives) {
            updateExecution(store, activeTabId, {
                input: 'SELECT streaming;',
                queryId: '',
                streamingStatus: 'preparing',
            });
            showModal.mockReturnValueOnce(confirmation.promise as never);
        } else {
            showModal.mockResolvedValue(true as never);
        }
        act(() => openQuery(result));
        if (queryIdArrives) {
            await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
            updateExecution(store, activeTabId, {
                input: 'SELECT streaming;',
                queryId: 'server-query-id',
                streamingStatus: 'running',
            });
            await resolveDeferred(confirmation, true);
        }
        await waitFor(() => expect(abort).toHaveBeenCalledTimes(1));
        expect(sendQuery).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe(replacement.input);
    });
    test.each([
        ['route round-trip', 'SELECT running;'],
        ['execution replacement', 'SELECT second;'],
        ['editor edit', 'SELECT edited while stopping;'],
        ['route during cancellation', 'SELECT running;'],
    ])('rejects a stale continuation after %s', async (staleCause, expectedInput) => {
        const onAfterOpen = jest.fn();
        const hook = renderOpenExternalQueryHook({runningInput: 'SELECT running;'});
        const abort = registerRunningQuery(hook.activeTabId);
        const continuation = createDeferred<boolean | {}>();
        const cancellationPending =
            staleCause === 'editor edit' || staleCause === 'route during cancellation';
        if (cancellationPending) {
            showModal.mockResolvedValue(true as never);
            sendQuery.mockReturnValue(continuation.promise);
        } else {
            showModal.mockReturnValueOnce(continuation.promise as never);
        }
        act(() => openQuery(hook.result, replacement.input, onAfterOpen));
        await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
        if (cancellationPending) {
            await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
        }
        if (staleCause === 'editor edit') {
            editQuery(hook.store, expectedInput);
        } else if (staleCause === 'route during cancellation') {
            act(() =>
                hook.history.push('/database?database=%2FRoot%2Fother&databasePage=diagnostics'),
            );
        } else if (staleCause === 'route round-trip') {
            act(() => {
                hook.history.push('/home');
                hook.history.push('/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics');
            });
        } else {
            const nextInput = 'SELECT second;';
            registerRunningQuery(hook.activeTabId);
            updateExecution(hook.store, hook.activeTabId, {
                input: nextInput,
                queryId: 'next-query',
                startTime: 2,
            });
        }
        await resolveDeferred(continuation, cancellationPending ? {} : true);
        expect(selectUserInput(hook.store.getState())).toBe(expectedInput);
        expect(abort).toHaveBeenCalledTimes(cancellationPending ? 1 : 0);
        expect(onAfterOpen).not.toHaveBeenCalled();
    });
    test.each(['hook instances', 'mode switch'])(
        'lets the latest request win across %s',
        async (scenario) => {
            const switchesMode = scenario === 'mode switch';
            const firstAfterOpen = jest.fn();
            const secondAfterOpen = jest.fn();
            const hook = renderOpenExternalQueryHook({
                dirtyInput: switchesMode ? 'SELECT dirty;' : undefined,
                initialLocation: switchesMode
                    ? '/database?database=%2FRoot%2Fdb&databasePage=query&queryTab=newQuery'
                    : undefined,
                runningInput: switchesMode ? undefined : 'SELECT running;',
            });
            const secondResult = switchesMode
                ? hook.result
                : renderHook(() => useOpenExternalQueryInEditor(), {wrapper: hook.wrapper}).result;
            const abort = switchesMode ? undefined : registerRunningQuery(hook.activeTabId);
            const confirmation = createDeferred<boolean>();
            showModal.mockReturnValue(confirmation.promise as never);
            act(() => openQuery(hook.result, 'SELECT first;', firstAfterOpen));
            await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
            if (switchesMode) {
                configureUIFactory({enableMultiTabQueryEditor: true});
                hook.rerender();
            }
            act(() => openQuery(secondResult, 'SELECT second;', secondAfterOpen));
            if (!switchesMode) {
                await waitFor(() => expect(showModal).toHaveBeenCalledTimes(2));
            }
            await resolveDeferred(confirmation, true);
            await waitFor(() =>
                expect(selectUserInput(hook.store.getState())).toBe('SELECT second;'),
            );
            expect(firstAfterOpen).not.toHaveBeenCalled();
            expect(secondAfterOpen).toHaveBeenCalledTimes(1);
            if (switchesMode) {
                expect(selectTabsOrder(hook.store.getState())).toHaveLength(2);
            } else {
                expect(abort).toHaveBeenCalledTimes(1);
            }
        },
    );
    test('opens a new tab in multi-tab mode without stopping the running tab', async () => {
        const onAfterOpen = jest.fn();
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            isMultiTabEnabled: true,
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        await act(async () => result.current({...replacement, onAfterOpen}));
        const state = store.getState();
        expect(showModal).not.toHaveBeenCalled();
        expect(abort).not.toHaveBeenCalled();
        expect(selectTabsOrder(state)).toHaveLength(2);
        expect(selectTabsById(state)[activeTabId].input).toBe('SELECT running;');
        expect(selectTabsById(state)[activeTabId].result?.isLoading).toBe(true);
        expect(selectUserInput(state)).toBe(replacement.input);
        expect(onAfterOpen).toHaveBeenCalledTimes(1);
    });
});
