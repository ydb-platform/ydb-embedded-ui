import React from 'react';

import {act, renderHook} from '@testing-library/react';

import {useHealthStatusNow} from '../useHealthStatusNow';

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
});

afterEach(() => {
    jest.useRealTimers();
});

test('marks a replacement deadline expired on its first committed render', () => {
    const committedExpired: boolean[] = [];
    const {rerender} = renderHook(
        ({deadline}) => {
            const now = useHealthStatusNow([deadline]);
            React.useLayoutEffect(() => {
                committedExpired.push(now >= deadline);
            });
        },
        {initialProps: {deadline: 15000}},
    );
    committedExpired.length = 0;
    jest.setSystemTime(10000);

    rerender({deadline: 5000});

    expect(committedExpired).toEqual([true]);
});

test('marks a deadline expired on the first committed render when enabled', () => {
    const committedExpired: boolean[] = [];
    const {rerender} = renderHook(
        ({enabled}) => {
            const now = useHealthStatusNow([5000], enabled);
            React.useLayoutEffect(() => {
                committedExpired.push(now >= 5000);
            });
        },
        {initialProps: {enabled: false}},
    );
    committedExpired.length = 0;
    act(() => jest.advanceTimersByTime(9000));

    rerender({enabled: true});

    expect(committedExpired).toEqual([true]);
});

test('sleeps until a deadline and keeps time stable during unrelated renders', () => {
    let renders = 0;
    const deadlines = [8000, 3500, 3500];
    const {result, rerender, unmount} = renderHook(() => {
        renders++;
        return useHealthStatusNow(deadlines);
    });
    const initialRenders = renders;
    expect(result.current).toBe(-Infinity);
    expect(jest.getTimerCount()).toBe(1);
    act(() => jest.advanceTimersByTime(2000));
    expect(renders).toBe(initialRenders);
    rerender();
    expect(result.current).toBe(-Infinity);
    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe(3500);
    expect(renders).toBe(initialRenders + 2);
    expect(jest.getTimerCount()).toBe(1);
    act(() => jest.advanceTimersByTime(4500));
    expect(result.current).toBe(8000);
    expect(jest.getTimerCount()).toBe(0);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
});

test.each([
    {deadlines: [], expiredUpTo: -Infinity},
    {deadlines: [undefined, NaN, Infinity, -Infinity], expiredUpTo: -Infinity},
    {deadlines: [750, 0, 250], expiredUpTo: 750},
    {deadlines: [0], expiredUpTo: 0},
    {deadlines: [1000], expiredUpTo: 1000},
])('does not schedule updates for $deadlines', ({deadlines, expiredUpTo}) => {
    let renders = 0;
    const {result, unmount} = renderHook(() => {
        renders++;
        return useHealthStatusNow(deadlines);
    });
    expect(result.current).toBe(expiredUpTo);
    const initialRenders = renders;
    act(() => jest.advanceTimersByTime(120000));
    expect(renders).toBe(initialRenders);
    expect(jest.getTimerCount()).toBe(0);
    unmount();
});

test.each(['visibilitychange', 'pageshow'])('resumes at crossed deadlines on %s', (event) => {
    const deadlines = [15000, 5000];
    const {result, unmount} = renderHook(() => useHealthStatusNow(deadlines));
    act(() => {
        jest.setSystemTime(10000);
        (event === 'pageshow' ? window : document).dispatchEvent(new Event(event));
    });
    expect(result.current).toBe(5000);
    expect(jest.getTimerCount()).toBe(1);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(15000);
    unmount();
});

test.each(['visibilitychange', 'pageshow'])(
    'reschedules without rendering before the next deadline on %s',
    (event) => {
        let renders = 0;
        const deadlines = [5000];
        const {result} = renderHook(() => {
            renders++;
            return useHealthStatusNow(deadlines);
        });
        const initialRenders = renders;
        act(() => {
            jest.setSystemTime(4000);
            (event === 'pageshow' ? window : document).dispatchEvent(new Event(event));
        });
        expect(renders).toBe(initialRenders);
        expect(jest.getTimerCount()).toBe(1);
        act(() => jest.advanceTimersByTime(1000));
        expect(result.current).toBe(5000);
    },
);

test('expires a fractional deadline at the next whole millisecond', () => {
    const {result} = renderHook(() => useHealthStatusNow([3500.5]));
    act(() => jest.advanceTimersByTime(2500));
    expect(result.current).toBe(-Infinity);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(3500.5);
    expect(jest.getTimerCount()).toBe(0);
});

test('replaces the pending timer when deadlines change', () => {
    let renders = 0;
    const {result, rerender} = renderHook(
        ({deadlines}) => {
            renders++;
            return useHealthStatusNow(deadlines);
        },
        {initialProps: {deadlines: [5000]}},
    );
    rerender({deadlines: [9000]});
    const initialRenders = renders;
    expect(jest.getTimerCount()).toBe(1);
    act(() => jest.advanceTimersByTime(4000));
    expect(renders).toBe(initialRenders);
    expect(result.current).toBe(-Infinity);
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current).toBe(9000);
    expect(jest.getTimerCount()).toBe(0);
});

test('disabling cancels updates but still returns the current snapshot when rendered', () => {
    let renders = 0;
    const {result, rerender} = renderHook(
        ({enabled}) => {
            renders++;
            return useHealthStatusNow([5000], enabled);
        },
        {initialProps: {enabled: true}},
    );
    expect(jest.getTimerCount()).toBe(1);
    rerender({enabled: false});
    const initialRenders = renders;
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(9000));
    expect(renders).toBe(initialRenders);
    rerender({enabled: false});
    expect(result.current).toBe(5000);
    expect(jest.getTimerCount()).toBe(0);
});

test.each(['visibilitychange', 'pageshow'])(
    'removes the timer and the %s listener when unmounted',
    (event) => {
        const {unmount} = renderHook(() => useHealthStatusNow([5000]));
        unmount();
        expect(jest.getTimerCount()).toBe(0);
        act(() => {
            jest.setSystemTime(2000);
            (event === 'pageshow' ? window : document).dispatchEvent(new Event(event));
        });
        expect(jest.getTimerCount()).toBe(0);
    },
);

test('returns expired data immediately when mounted with updates disabled', () => {
    const {result} = renderHook(() => useHealthStatusNow([750], false));
    expect(result.current).toBe(750);
    expect(jest.getTimerCount()).toBe(0);
});
