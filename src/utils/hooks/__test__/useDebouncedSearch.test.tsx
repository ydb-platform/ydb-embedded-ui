import {act, renderHook} from '@testing-library/react';

import {useDebouncedSearch} from '../useDebouncedSearch';

describe('useDebouncedSearch', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function setup() {
        return renderHook(({value, scope}) => useDebouncedSearch(value, scope), {
            initialProps: {value: 'a', scope: 'one'},
        });
    }

    it('does not schedule an update when the value is already applied', () => {
        const {result, rerender} = setup();
        expect(jest.getTimerCount()).toBe(0);
        rerender({value: 'ab', scope: 'one'});
        expect(jest.getTimerCount()).toBe(1);
        rerender({value: 'a', scope: 'one'});
        expect(jest.getTimerCount()).toBe(0);
        rerender({value: 'ab', scope: 'one'});
        rerender({value: 'b', scope: 'two'});
        expect(result.current).toBe('b');
        expect(jest.getTimerCount()).toBe(0);
    });

    it('applies only the latest filter after 200 ms of inactivity', () => {
        const {result, rerender} = setup();
        rerender({value: 'ab', scope: 'one'});
        act(() => jest.advanceTimersByTime(150));
        rerender({value: 'abc', scope: 'one'});
        act(() => jest.advanceTimersByTime(199));
        expect(result.current).toBe('a');
        act(() => jest.advanceTimersByTime(1));
        expect(result.current).toBe('abc');
    });

    it('resets immediately on scope changes and cancels the previous pending filter', () => {
        const {result, rerender} = setup();
        rerender({value: 'pending', scope: 'one'});
        act(() => jest.advanceTimersByTime(150));
        rerender({value: 'b', scope: 'two'});
        expect(result.current).toBe('b');
        rerender({value: 'bc', scope: 'two'});
        act(() => jest.advanceTimersByTime(50));
        expect(result.current).toBe('b');
        act(() => jest.advanceTimersByTime(150));
        expect(result.current).toBe('bc');
    });

    it('resets even when the input value stays the same across scopes', () => {
        const {result, rerender} = setup();
        rerender({value: 'ab', scope: 'one'});
        expect(result.current).toBe('a');
        rerender({value: 'ab', scope: 'two'});
        expect(result.current).toBe('ab');
    });
});
