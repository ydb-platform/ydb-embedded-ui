import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {act, renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';

import {configureStore} from '../../../../../store';
import {
    changeUserInput,
    selectIsDirty,
    selectUserInput,
    setIsDirty,
} from '../../../../../store/reducers/query/query';
import {configureUIFactory} from '../../../../../uiFactory/uiFactory';
import {useOpenExternalQueryInEditor} from '../useOpenExternalQueryInEditor';

function renderOpenExternalQueryHook({
    isMultiTabEnabled = false,
    dirtyInput,
    initialLocation = '/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics',
}: {
    isMultiTabEnabled?: boolean;
    dirtyInput?: string;
    initialLocation?: string;
} = {}) {
    configureUIFactory({enableMultiTabQueryEditor: isMultiTabEnabled});
    const {history, store} = configureStore();
    history.push(initialLocation);

    if (dirtyInput !== undefined) {
        store.dispatch(changeUserInput({input: 'SELECT saved;'}));
        store.dispatch(setIsDirty(false));
        store.dispatch(changeUserInput({input: dirtyInput}));
    }

    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>
            <Router history={history}>{children}</Router>
        </Provider>
    );

    return {
        history,
        store,
        ...renderHook(() => useOpenExternalQueryInEditor(), {wrapper}),
    };
}

function getSearchParam(search: string, name: string) {
    return new URLSearchParams(search).get(name);
}

describe('useOpenExternalQueryInEditor', () => {
    const showModal = jest.spyOn(NiceModal, 'show');

    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        showModal.mockReset();
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
});
