import React from 'react';

import {act, renderHook} from '@testing-library/react';
import {createMemoryHistory} from 'history';
import {Router} from 'react-router-dom';

import {useDebouncedSearch} from '../../../utils/hooks/useDebouncedSearch';
import {useStorageSearchScope} from '../useStorageQueryParams';

describe('Storage search scope', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        const history = createMemoryHistory({initialEntries: ['/storageGroup?database=one']});
        const hook = renderHook(({value}) => useDebouncedSearch(value, useStorageSearchScope()), {
            initialProps: {value: 'a'},
            wrapper: ({children}: {children: React.ReactNode}) => (
                <Router history={history}>{children}</Router>
            ),
        });
        return {...hook, history};
    }

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
                history.replace(`/storageGroup?${params}`);
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
