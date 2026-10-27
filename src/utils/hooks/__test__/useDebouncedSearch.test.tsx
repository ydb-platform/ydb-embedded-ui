import React from 'react';

import {act, renderHook} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';

import {useDebouncedSearch} from '../useDebouncedSearch';

describe('useDebouncedSearch', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const history = createMemoryHistory({initialEntries: ['/cluster/nodes?database=one']});
        const hook = renderHook(({value}) => useDebouncedSearch(value), {
            initialProps: {value: 'a'},
            wrapper: ({children}: {children: React.ReactNode}) => (
                <Router history={history}>{children}</Router>
            ),
        });
        return {...hook, history};
    }

    it('applies only the latest filter after 200 ms of inactivity', () => {
        const {result, rerender} = setup();
        rerender({value: 'ab'});
        act(() => jest.advanceTimersByTime(150));
        rerender({value: 'abc'});
        act(() => jest.advanceTimersByTime(199));
        expect(result.current).toBe('a');
        act(() => jest.advanceTimersByTime(1));
        expect(result.current).toBe('abc');
    });

    it.each([
        'database',
        'clusterName',
        'environment',
        'backend',
        'schema',
        'path',
        'groupId',
        'nodeId',
        'pDiskId',
        'vDiskId',
    ])(
        'uses the current value immediately after %s changes, then debounces new edits',
        (scopeParam) => {
            const {result, rerender, history} = setup();
            rerender({value: 'ab'});
            act(() => {
                const params = new URLSearchParams(history.location.search);
                params.set(scopeParam, 'two');
                history.replace(`/cluster/nodes?${params}`);
            });
            expect(result.current).toBe('ab');
            rerender({value: 'abc'});
            expect(result.current).toBe('ab');
            act(() => jest.advanceTimersByTime(200));
            expect(result.current).toBe('abc');
        },
    );

    it('resets on a route change and does not write to the URL', () => {
        const {result, rerender, history} = setup();
        rerender({value: 'ab'});
        act(() => history.push('/another-page?search=keep'));
        expect(result.current).toBe('ab');
        act(() => jest.advanceTimersByTime(200));
        expect(history.location.pathname).toBe('/another-page');
        expect(history.location.search).toBe('?search=keep');
    });
});
