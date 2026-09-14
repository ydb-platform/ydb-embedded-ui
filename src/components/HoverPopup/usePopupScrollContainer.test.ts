import {act, renderHook} from '@testing-library/react';

import {usePopupScrollContainer} from './usePopupScrollContainer';

const disconnect = jest.fn();
const originalObserver = global.ResizeObserver;

beforeEach(() => {
    disconnect.mockClear();
    global.ResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        disconnect,
    })) as unknown as typeof ResizeObserver;
});

afterEach(() => {
    global.ResizeObserver = originalObserver;
    document.body.replaceChildren();
});

test('uses the nearest scrolling ancestor and updates height within its boundaries', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const anchor = document.createElement('span');
    outer.style.overflowY = 'auto';
    inner.style.overflowY = 'auto';
    outer.append(inner);
    inner.append(anchor);
    document.body.append(outer);
    inner.getBoundingClientRect = () => ({top: 100, bottom: 500}) as DOMRect;
    anchor.getBoundingClientRect = () => ({top: 200, bottom: 240}) as DOMRect;
    const {result, rerender} = renderHook(({open}) => usePopupScrollContainer(anchor, open), {
        initialProps: {open: true},
    });
    expect(result.current).toEqual({container: inner, maxHeight: 244});
    anchor.getBoundingClientRect = () => ({top: 400, bottom: 440}) as DOMRect;
    act(() => inner.dispatchEvent(new Event('scroll')));
    expect(result.current.maxHeight).toBe(284);
    rerender({open: false});
    expect(disconnect).toHaveBeenCalledTimes(1);
    // Closing animations retain the same portal ownership.
    expect(result.current.container).toBe(inner);
    anchor.getBoundingClientRect = () => ({top: 200, bottom: 240}) as DOMRect;
    act(() => inner.dispatchEvent(new Event('scroll')));
    expect(result.current.maxHeight).toBe(284);
});

test('keeps the default portal when the anchor has no scrolling ancestor', () => {
    const anchor = document.createElement('span');
    document.body.append(anchor);
    const {result} = renderHook(() => usePopupScrollContainer(anchor, true));
    expect(result.current).toEqual({});
});

test('does not portal outside a fullscreen subtree', () => {
    const outer = document.createElement('div');
    const fullscreen = document.createElement('div');
    const anchor = document.createElement('span');
    outer.style.overflowY = 'auto';
    outer.append(fullscreen);
    fullscreen.append(anchor);
    document.body.append(outer);
    const descriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
    Object.defineProperty(document, 'fullscreenElement', {configurable: true, value: fullscreen});
    try {
        const {result} = renderHook(() => usePopupScrollContainer(anchor, true));
        expect(result.current.container).toBe(fullscreen);
    } finally {
        if (descriptor) {
            Object.defineProperty(document, 'fullscreenElement', descriptor);
        } else {
            Reflect.deleteProperty(document, 'fullscreenElement');
        }
    }
});
