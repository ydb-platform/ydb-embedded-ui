import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';

import type {QueryTabState} from '../../../../../../store/reducers/query/types';
import {
    getQueryPageLeaveState,
    useBeforeUnloadPrompt,
    useQueryPageLeaveGuard,
} from '../useQueryPageLeaveGuard';

function createTabState(tabId: string, overrides: Partial<QueryTabState> = {}): QueryTabState {
    const now = Date.now();

    return {
        id: tabId,
        title: `Tab ${tabId}`,
        input: '',
        savedInput: '',
        isDirty: false,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

describe('getQueryPageLeaveState', () => {
    test('returns the first running tab in tabsOrder even when it is not active', () => {
        const tabsById = {
            first: createTabState('first'),
            second: createTabState('second', {
                result: {type: 'execute', queryId: 'query-2', isLoading: true},
            }),
            third: createTabState('third'),
        };

        expect(getQueryPageLeaveState(['first', 'second', 'third'], tabsById)).toEqual({
            firstRunningTabId: 'second',
            hasRunningTabs: true,
            hasDirtyTabs: false,
            shouldPromptOnPageLeave: true,
        });
    });

    test('prefers the first running tab when multiple tabs are running', () => {
        const tabsById = {
            first: createTabState('first', {
                result: {type: 'execute', queryId: 'query-1', isLoading: true},
            }),
            second: createTabState('second', {
                result: {type: 'execute', queryId: 'query-2', isLoading: true},
            }),
        };

        expect(getQueryPageLeaveState(['first', 'second'], tabsById).firstRunningTabId).toBe(
            'first',
        );
    });

    test('does not prompt on dirty tabs when there are no running tabs', () => {
        const tabsById = {
            first: createTabState('first'),
            second: createTabState('second', {isDirty: true}),
        };

        expect(getQueryPageLeaveState(['first', 'second'], tabsById)).toEqual({
            firstRunningTabId: undefined,
            hasRunningTabs: false,
            hasDirtyTabs: true,
            shouldPromptOnPageLeave: false,
        });
    });

    test('does not prompt when there are no running or dirty tabs', () => {
        const tabsById = {
            first: createTabState('first'),
            second: createTabState('second'),
        };

        expect(getQueryPageLeaveState(['first', 'second'], tabsById)).toEqual({
            firstRunningTabId: undefined,
            hasRunningTabs: false,
            hasDirtyTabs: false,
            shouldPromptOnPageLeave: false,
        });
    });
});

describe('useBeforeUnloadPrompt', () => {
    afterEach(() => {
        window.onbeforeunload = null;
    });

    test('registers a native beforeunload handler when enabled', () => {
        renderHook(() => useBeforeUnloadPrompt(true));

        expect(window.onbeforeunload).toEqual(expect.any(Function));

        const event = {
            preventDefault: jest.fn(),
            returnValue: undefined,
        } as unknown as BeforeUnloadEvent;

        window.onbeforeunload?.(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.returnValue).toBe('');
    });

    test('clears the native beforeunload handler when disabled', () => {
        const {rerender, unmount} = renderHook(
            ({enabled}: {enabled: boolean}) => useBeforeUnloadPrompt(enabled),
            {initialProps: {enabled: true}},
        );

        expect(window.onbeforeunload).toEqual(expect.any(Function));

        rerender({enabled: false});
        expect(window.onbeforeunload).toBeNull();

        rerender({enabled: true});
        expect(window.onbeforeunload).toEqual(expect.any(Function));

        unmount();
        expect(window.onbeforeunload).toBeNull();
    });
});

describe('useQueryPageLeaveGuard', () => {
    afterEach(() => {
        window.onbeforeunload = null;
    });

    test('does not register aggregated beforeunload prompt when disabled', () => {
        const tabsOrder = ['first', 'second'];
        const tabsById = {
            first: createTabState('first', {
                result: {type: 'execute', queryId: 'query-1', isLoading: true},
            }),
            second: createTabState('second'),
        };
        const store = configureStore({
            reducer: () => ({
                query: {
                    tabsOrder,
                    tabsById,
                },
            }),
        });

        const wrapper = ({children}: {children: React.ReactNode}) => {
            return React.createElement(Provider, {store, children});
        };

        renderHook(() => useQueryPageLeaveGuard(false), {wrapper});

        expect(window.onbeforeunload).toBeNull();
    });
});
