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
const staleInputs: Record<string, string> = {
    'editor edit': 'SELECT edited while stopping;',
    'execution replacement': 'SELECT second;',
    'route round-trip': 'SELECT running;',
};
const databaseParam = 'database=%2FRoot%2Fdb';
const canonicalRoute = `/tenant?${databaseParam}&databasePage=diagnostics`;
const routeCases: Array<[string, string, string, string?]> = [
    ['canonical tenant route', canonicalRoute, '/database', undefined],
    [
        'already on Query without a duplicate push',
        `/database?${databaseParam}&databasePage=query&queryTab=saved`,
        '/database',
        'no-push',
    ],
    [
        'environment route',
        `/cloud-prod/node/1?${databaseParam}&databasePage=query`,
        '/cloud-prod/database',
        undefined,
    ],
    ['extension route', `/cloud-prod/custom?${databaseParam}`, '/cloud-prod/database', 'extension'],
    [
        'legacy name normalization',
        '/database?name=%2FRoot%2Fdb&databasePage=diagnostics',
        '/database',
        'normalize',
    ],
];
type TestStore = ReturnType<typeof configureStore>['store'];
function setExecution(
    store: TestStore,
    tabId: string,
    {
        input,
        queryId = 'running-query',
        startTime = 1,
        isLoading = true,
        streamingStatus,
    }: {
        input: string;
        queryId?: string;
        startTime?: number;
        isLoading?: boolean;
        streamingStatus?: 'preparing' | 'running';
    },
) {
    store.dispatch(changeUserInput({input}));
    store.dispatch(setLastExecutedQueryText({tabId, queryText: input}));
    store.dispatch(setIsDirty(false));
    store.dispatch(
        setQueryResult({
            tabId,
            result: {
                executionId: `execution-${startTime}`,
                type: 'execute',
                queryId,
                isLoading,
                startTime,
                ...(streamingStatus ? {streamingStatus} : {}),
            },
        }),
    );
}
function renderOpenExternalQueryHook({
    isMultiTabEnabled = false,
    dirtyInput,
    runningInput,
    isStreaming = false,
    initialLocation = '/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics',
    environments,
    singleClusterMode,
}: {
    isMultiTabEnabled?: boolean;
    dirtyInput?: string;
    runningInput?: string;
    isStreaming?: boolean;
    initialLocation?: string;
    environments?: string[];
    singleClusterMode?: boolean;
} = {}) {
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
    test.each(routeCases)(
        'opens on the Query route from %s',
        async (_name, initialLocation, expectedPath, mode) => {
            const normalizeLegacy = mode === 'normalize';
            const hook = renderOpenExternalQueryHook({
                dirtyInput: normalizeLegacy ? 'SELECT unsaved;' : undefined,
                environments: mode === 'extension' ? ['cloud-prod'] : undefined,
                initialLocation,
                isMultiTabEnabled: !normalizeLegacy,
                singleClusterMode: mode === 'extension' ? false : undefined,
            });
            const push = jest.spyOn(hook.history, 'push');
            const onAfterOpen = jest.fn();
            if (normalizeLegacy) {
                const confirmation = createDeferred<boolean>();
                showModal.mockReturnValueOnce(confirmation.promise as never);
                act(() => hook.result.current({...replacement, onAfterOpen}));
                await waitFor(() => expect(showModal).toHaveBeenCalled());
                await act(async () => {
                    hook.history.replace(
                        '/database?database=%2FRoot%2Fdb&databasePage=diagnostics',
                    );
                    confirmation.resolve(true);
                    await confirmation.promise;
                });
            } else {
                await act(async () => hook.result.current({...replacement, onAfterOpen}));
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
        await act(async () => result.current({...replacement, onAfterOpen}));
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
            await act(async () => result.current({...replacement, onAfterOpen}));
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
        act(() => result.current({...replacement, onAfterOpen}));
        await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
        const runningInput = 'SELECT started while confirming;';
        const abort = registerRunningQuery(activeTabId);
        await act(async () => {
            setExecution(store, activeTabId, {
                input: runningInput,
                queryId: 'late-query',
                startTime: 2,
            });
        });
        await act(async () => {
            dirtyConfirmation.resolve(true);
            await dirtyConfirmation.promise;
        });
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
        ['cancel preserves the query', false],
        ['accept cancels the originating database before opening', true],
    ])('handles running confirmation: %s', async (_name, confirmed) => {
        const onAfterOpen = jest.fn();
        const hook = renderOpenExternalQueryHook({runningInput: 'SELECT running;'});
        const abort = registerRunningQuery(hook.activeTabId);
        showModal.mockResolvedValue(confirmed as never);
        if (confirmed) {
            await act(async () => {
                hook.history.push('/database?database=%2FRoot%2Fother&databasePage=diagnostics');
            });
        }
        await act(async () => hook.result.current({...replacement, onAfterOpen}));
        expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
        expect(abort).toHaveBeenCalledTimes(confirmed ? 1 : 0);
        expect(sendQuery).toHaveBeenCalledTimes(confirmed ? 1 : 0);
        expect(selectUserInput(hook.store.getState())).toBe(
            confirmed ? replacement.input : 'SELECT running;',
        );
        expect(onAfterOpen).toHaveBeenCalledTimes(confirmed ? 1 : 0);
        if (confirmed) {
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
        act(() => result.current({...replacement, onAfterOpen}));
        await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
        await act(async () => {
            if (finishExecution) {
                setExecution(store, activeTabId, {
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
            await act(async () => {
                setExecution(store, activeTabId, {
                    input: 'SELECT streaming;',
                    queryId: '',
                    streamingStatus: 'preparing',
                });
            });
            showModal.mockReturnValueOnce(confirmation.promise as never);
        } else {
            showModal.mockResolvedValue(true as never);
        }
        act(() => result.current(replacement));
        if (queryIdArrives) {
            await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
            await act(async () => {
                setExecution(store, activeTabId, {
                    input: 'SELECT streaming;',
                    queryId: 'server-query-id',
                    streamingStatus: 'running',
                });
                confirmation.resolve(true);
                await confirmation.promise;
            });
        }
        await waitFor(() => expect(abort).toHaveBeenCalledTimes(1));
        expect(sendQuery).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe(replacement.input);
    });
    test.each(['route round-trip', 'execution replacement', 'editor edit'])(
        'rejects a stale continuation after %s',
        async (staleCause) => {
            const onAfterOpen = jest.fn();
            const hook = renderOpenExternalQueryHook({runningInput: 'SELECT running;'});
            const abort = registerRunningQuery(hook.activeTabId);
            const continuation = createDeferred<boolean | {}>();
            if (staleCause === 'editor edit') {
                showModal.mockResolvedValue(true as never);
                sendQuery.mockReturnValue(continuation.promise);
            } else {
                showModal.mockReturnValueOnce(continuation.promise as never);
            }
            act(() => hook.result.current({...replacement, onAfterOpen}));
            await waitFor(() => expect(showModal).toHaveBeenCalledTimes(1));
            if (staleCause === 'editor edit') {
                await waitFor(() => expect(sendQuery).toHaveBeenCalledTimes(1));
                await act(async () => {
                    hook.store.dispatch(changeUserInput({input: 'SELECT edited while stopping;'}));
                });
            } else if (staleCause === 'route round-trip') {
                await act(async () => {
                    hook.history.push('/home');
                    hook.history.push('/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics');
                });
            } else {
                const nextInput = 'SELECT second;';
                registerRunningQuery(hook.activeTabId);
                await act(async () => {
                    setExecution(hook.store, hook.activeTabId, {
                        input: nextInput,
                        queryId: 'next-query',
                        startTime: 2,
                    });
                });
            }
            await act(async () => {
                continuation.resolve(staleCause === 'editor edit' ? {} : true);
                await continuation.promise;
            });
            expect(selectUserInput(hook.store.getState())).toBe(staleInputs[staleCause]);
            expect(abort).toHaveBeenCalledTimes(staleCause === 'editor edit' ? 1 : 0);
            expect(onAfterOpen).not.toHaveBeenCalled();
        },
    );
    test('lets the latest request win across separate hook instances', async () => {
        const firstAfterOpen = jest.fn();
        const secondAfterOpen = jest.fn();
        const hook = renderOpenExternalQueryHook({runningInput: 'SELECT running;'});
        const secondHook = renderHook(() => useOpenExternalQueryInEditor(), {
            wrapper: hook.wrapper,
        });
        const abort = registerRunningQuery(hook.activeTabId);
        const confirmation = createDeferred<boolean>();
        showModal.mockReturnValue(confirmation.promise as never);
        act(() => {
            hook.result.current({
                title: 'First replacement',
                input: 'SELECT first;',
                onAfterOpen: firstAfterOpen,
            });
            secondHook.result.current({
                title: 'Second replacement',
                input: 'SELECT second;',
                onAfterOpen: secondAfterOpen,
            });
        });
        await waitFor(() => expect(showModal).toHaveBeenCalledTimes(2));
        await act(async () => {
            confirmation.resolve(true);
            await confirmation.promise;
        });
        await waitFor(() => expect(selectUserInput(hook.store.getState())).toBe('SELECT second;'));
        expect(abort).toHaveBeenCalledTimes(1);
        expect(firstAfterOpen).not.toHaveBeenCalled();
        expect(secondAfterOpen).toHaveBeenCalledTimes(1);
    });
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
