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
} from '../../../../../store/reducers/query/query';
import {configureUIFactory} from '../../../../../uiFactory/uiFactory';
import {useOpenExternalQueryInEditor} from '../useOpenExternalQueryInEditor';

function renderOpenExternalQueryHook({
    isMultiTabEnabled = false,
    dirtyInput,
}: {
    isMultiTabEnabled?: boolean;
    dirtyInput?: string;
} = {}) {
    configureUIFactory({enableMultiTabQueryEditor: isMultiTabEnabled});
    const {history, store} = configureStore();
    history.replace('/tenant?database=%2FRoot%2Fdb&databasePage=diagnostics');

    if (dirtyInput) {
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
