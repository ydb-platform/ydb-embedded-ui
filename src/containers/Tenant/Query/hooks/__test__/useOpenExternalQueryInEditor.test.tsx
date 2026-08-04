import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {act, renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';

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
import {RUNNING_QUERY_DIALOG} from '../../../../../utils/hooks/withConfirmation/RunningQueryDialog';
import {UNSAVED_CHANGES_DIALOG} from '../../../../../utils/hooks/withConfirmation/UnsavedChangesDialog';
import {queryExecutionManagerInstance} from '../../QueryEditor/utils/queryExecutionManager';
import {useOpenExternalQueryInEditor} from '../useOpenExternalQueryInEditor';

function renderOpenExternalQueryHook({
    isMultiTabEnabled = false,
    dirtyInput,
    runningInput,
    initialLocation = '/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics',
}: {
    isMultiTabEnabled?: boolean;
    dirtyInput?: string;
    runningInput?: string;
    initialLocation?: string;
} = {}) {
    configureUIFactory({enableMultiTabQueryEditor: isMultiTabEnabled});
    const {history, store} = configureStore();
    history.push(initialLocation);
    const activeTabId = selectActiveTabId(store.getState());
    if (!activeTabId) {
        throw new Error('Expected an active query tab');
    }

    if (runningInput !== undefined) {
        store.dispatch(changeUserInput({input: runningInput}));
        store.dispatch(setLastExecutedQueryText({tabId: activeTabId, queryText: runningInput}));
        store.dispatch(setIsDirty(false));
        const runningResult = {
            executionId: 'running-execution',
            type: 'execute' as const,
            queryId: 'running-query',
            isLoading: true,
            startTime: 1,
        };
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

function registerRunningQuery(tabId: string) {
    const abort = jest.fn();
    const query = Object.assign(new Promise<never>(() => undefined), {abort});
    queryExecutionManagerInstance.registerQuery(tabId, query);
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
        showModal.mockReset();
    });

    afterEach(() => {
        queryExecutionManagerInstance.abortAll();
    });

    afterAll(() => {
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

    test('stops a running single-tab query before replacing it', async () => {
        const {activeTabId, result, store} = renderOpenExternalQueryHook({
            runningInput: 'SELECT running;',
        });
        const abort = registerRunningQuery(activeTabId);
        showModal.mockResolvedValue(true as never);

        await act(async () => {
            await result.current({title: 'Replacement', input: 'SELECT replacement;'});
        });

        expect(showModal).toHaveBeenCalledWith(RUNNING_QUERY_DIALOG, {
            id: RUNNING_QUERY_DIALOG,
        });
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
        expect(abort).not.toHaveBeenCalled();
        expect(selectUserInput(store.getState())).toBe('SELECT edited while confirming;');
        expect(selectResult(store.getState())?.isLoading).toBe(true);
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
