import {act, renderHook} from '@testing-library/react';

import * as healthClock from '../healthClock';
import {useHealthStatusNow} from '../useHealthStatusNow';

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    jest.spyOn(healthClock, 'getHealthStatusNow').mockImplementation(
        healthClock.createHealthClock(),
    );
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('sleeps until a deadline and keeps time stable during unrelated renders', () => {
    let renders = 0;
    const deadlines = [3500, 8000];
    const {result, rerender, unmount} = renderHook(() => {
        renders++;
        return useHealthStatusNow(deadlines);
    });
    const initialRenders = renders;
    act(() => jest.advanceTimersByTime(2000));
    expect(renders).toBe(initialRenders);
    rerender();
    expect(result.current).toBe(1000);
    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe(3500);
    expect(renders).toBe(initialRenders + 2);
    act(() => jest.advanceTimersByTime(4500));
    expect(result.current).toBe(8000);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
});

test('legacy and already expired data schedule no recurring updates', () => {
    let renders = 0;
    const {unmount} = renderHook(() => {
        renders++;
        return useHealthStatusNow([undefined, 0, NaN]);
    });
    const initialRenders = renders;
    act(() => jest.advanceTimersByTime(120000));
    expect(renders).toBe(initialRenders);
    expect(jest.getTimerCount()).toBe(0);
    unmount();
});

test.each(['visibilitychange', 'pageshow'])('resumes at crossed deadlines on %s', (event) => {
    const {result, rerender, unmount} = renderHook(({deadline}) => useHealthStatusNow([deadline]), {
        initialProps: {deadline: 5000},
    });
    act(() => {
        jest.setSystemTime(10000);
        (event === 'pageshow' ? window : document).dispatchEvent(new Event(event));
    });
    expect(result.current).toBe(10000);
    rerender({deadline: 15000});
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(15000);
    unmount();
});

test('backward wall-clock corrections do not extend a relative lifetime', () => {
    const {result, unmount} = renderHook(() => useHealthStatusNow([3500]));
    act(() => {
        jest.setSystemTime(0);
        jest.advanceTimersByTime(2499);
    });
    expect(result.current).toBe(1000);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(3500);
    unmount();
});
