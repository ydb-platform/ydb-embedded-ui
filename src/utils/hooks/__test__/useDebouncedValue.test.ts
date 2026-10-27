import React from 'react';

import {act, renderHook} from '@testing-library/react';

import {useDebouncedValue} from '../useDebouncedValue';

describe('useDebouncedValue', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it.each(['ab', '', 0, null])(
        'keeps newer input when the parent acknowledges %p',
        (submitted) => {
            const {result} = renderHook(() => {
                const [value, setValue] = React.useState<string | number | null>('a');
                const [input, update] = useDebouncedValue({value, onUpdate: setValue});
                return {value, input, update};
            });

            act(() => result.current.update(submitted));
            act(() => {
                jest.advanceTimersByTime(200);
                // The parent's update and the next keystroke commit together.
                result.current.update('next');
            });

            expect(result.current.value).toBe(submitted);
            expect(result.current.input).toBe('next');
            act(() => jest.advanceTimersByTime(200));
            expect(result.current.value).toBe('next');
            expect(result.current.input).toBe('next');
        },
    );

    it('cancels the pending callback when the value changes externally', () => {
        const onUpdate = jest.fn();
        const {result, rerender} = renderHook(({value}) => useDebouncedValue({value, onUpdate}), {
            initialProps: {value: 'a'},
        });
        act(() => result.current[1]('ab'));
        rerender({value: ''});
        expect(result.current[0]).toBe('');
        act(() => jest.runAllTimers());
        expect(onUpdate).not.toHaveBeenCalled();

        act(() => result.current[1]('new'));
        act(() => jest.advanceTimersByTime(200));
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith('new');
    });

    it('keeps the callback captured when typing', () => {
        const onUpdate = jest.fn();
        const nextOnUpdate = jest.fn();
        const {result, rerender} = renderHook(
            ({callback}) => useDebouncedValue<string>({value: '', onUpdate: callback}),
            {initialProps: {callback: onUpdate}},
        );
        act(() => result.current[1]('query'));
        act(() => jest.advanceTimersByTime(100));
        rerender({callback: nextOnUpdate});
        act(() => jest.advanceTimersByTime(100));
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith('query');
        expect(nextOnUpdate).not.toHaveBeenCalled();
    });

    it('cancels the pending callback on unmount', () => {
        const onUpdate = jest.fn();
        const {result, unmount} = renderHook(() =>
            useDebouncedValue<string>({value: '', onUpdate}),
        );
        act(() => result.current[1]('query'));
        unmount();
        act(() => jest.runAllTimers());
        expect(onUpdate).not.toHaveBeenCalled();
    });
});
