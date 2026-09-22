import {act, renderHook} from '@testing-library/react';

import {useVirtualizedDiskList} from '../useVirtualizedDiskList';

const observers: Observer[] = [];
const originalObserver = window.IntersectionObserver;

class Observer implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0];
    readonly observe = jest.fn();
    readonly unobserve = jest.fn();
    readonly disconnect = jest.fn();
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
    }

    readonly takeRecords = () => [];

    publish(target: Element, isIntersecting: boolean) {
        this.callback(
            [
                {
                    target,
                    isIntersecting,
                    intersectionRatio: isIntersecting ? 1 : 0,
                    boundingClientRect: target.getBoundingClientRect(),
                    intersectionRect: target.getBoundingClientRect(),
                    rootBounds: null,
                    time: 0,
                },
            ],
            this,
        );
    }
}

function latestObserver() {
    const observer = observers.at(-1);
    if (!observer) {
        throw new Error('Missing disk visibility observer');
    }
    return observer;
}

const disks = Array.from({length: 11}, (_, index) => ({StringifiedId: `disk-${index}`}));

function setup(enabled = true, initialDisks = disks) {
    const container = document.createElement('div');
    const children = initialDisks.map(() => {
        const child = document.createElement('div');
        child.append(document.createElement('button'));
        container.append(child);
        return child;
    });
    document.body.append(container);
    const hook = renderHook(
        ({items, virtualized}) => {
            const result = useVirtualizedDiskList(items, virtualized);
            result.containerRef.current = container;
            return {...result, count: items.length};
        },
        {initialProps: {items: initialDisks, virtualized: enabled}},
    );
    const renderedIndices = () =>
        Array.from({length: hook.result.current.count}, (_, index) => index).filter(
            hook.result.current.shouldRenderDisk,
        );
    return {...hook, container, children, renderedIndices};
}

beforeEach(() => {
    window.IntersectionObserver = Observer;
});

afterEach(() => {
    window.IntersectionObserver = originalObserver;
    observers.length = 0;
    document.body.replaceChildren();
});

test.each([0, 1, 9])('renders all %i disks immediately without an observer', (count) => {
    const {renderedIndices} = setup(true, disks.slice(0, count));
    expect(renderedIndices()).toEqual(Array.from({length: count}, (_, index) => index));
    expect(observers).toHaveLength(0);
});

test('virtualizes exactly 10 disks, rendering content only after visibility is reported', () => {
    const {children, renderedIndices} = setup(true, disks.slice(0, 10));
    expect(renderedIndices()).toEqual([]);
    expect(observers).toHaveLength(1);

    act(() => latestObserver().publish(children[3], true));
    expect(renderedIndices()).toEqual([2, 3, 4]);

    act(() => latestObserver().publish(children[3], false));
    expect(renderedIndices()).toEqual([]);
});

test('starts and stops observing when the disk count crosses the threshold', () => {
    const {children, container, rerender, renderedIndices} = setup();
    const previousObserver = latestObserver();

    act(() => {
        container.replaceChildren(...children.slice(0, 9));
        rerender({items: disks.slice(0, 9), virtualized: true});
    });
    expect(previousObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(renderedIndices()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);

    act(() => {
        container.replaceChildren(...children.slice(0, 10));
        rerender({items: disks.slice(0, 10), virtualized: true});
    });
    expect(observers).toHaveLength(2);
    expect(renderedIndices()).toEqual([]);
    act(() => previousObserver.publish(children[3], true));
    expect(renderedIndices()).toEqual([]);

    act(() => latestObserver().publish(children[3], true));
    expect(renderedIndices()).toEqual([2, 3, 4]);
});

test('preserves the keyboard target when a short list grows to 10 disks', () => {
    const {children, container, rerender, renderedIndices} = setup(true, disks.slice(0, 9));
    act(() => children[3].querySelector('button')?.focus());

    act(() => {
        container.append(document.createElement('div'));
        rerender({items: disks.slice(0, 10), virtualized: true});
    });
    expect(renderedIndices()).toEqual([2, 3, 4]);
});

test('keeps visibility attached to disk identity after reordering and ignores old observations', () => {
    const {children, container, rerender, renderedIndices} = setup();
    const previousObserver = latestObserver();
    act(() => previousObserver.publish(children[3], true));
    const order = [0, 1, 2, 5, 4, 3, 6, 7, 8, 9, 10];
    act(() => {
        container.replaceChildren(...order.map((index) => children[index]));
        rerender({items: order.map((index) => disks[index]), virtualized: true});
    });
    expect(renderedIndices()).toEqual([4, 5, 6]);

    act(() => previousObserver.publish(children[3], false));
    expect(renderedIndices()).toEqual([4, 5, 6]);
    act(() => latestObserver().publish(children[3], false));
    expect(renderedIndices()).toEqual([]);
});

test('keeps the last focused disk and neighbors mounted for keyboard return navigation', () => {
    const {children, renderedIndices} = setup();
    const outside = document.createElement('button');
    document.body.append(outside);

    act(() => children[3].querySelector('button')?.focus());
    expect(renderedIndices()).toEqual([2, 3, 4]);
    act(() => children[4].querySelector('button')?.focus());
    expect(renderedIndices()).toEqual([3, 4, 5]);
    act(() => outside.focus());
    expect(renderedIndices()).toEqual([3, 4, 5]);
});

test('clears the keyboard return target when its disk disappears', () => {
    const {children, rerender, renderedIndices} = setup();
    act(() => children[3].querySelector('button')?.focus());
    expect(renderedIndices()).toEqual([2, 3, 4]);

    rerender({items: disks.filter((_, index) => index !== 3), virtualized: true});
    expect(renderedIndices()).toEqual([]);
});

test('keeps missing identities independent when visibility changes', () => {
    const {children, rerender, renderedIndices} = setup();
    rerender({items: disks.map(() => ({StringifiedId: ''})), virtualized: true});
    act(() => {
        latestObserver().publish(children[3], true);
        latestObserver().publish(children[6], false);
    });
    expect(renderedIndices()).toEqual([2, 3, 4]);
});

test('renders every disk while virtualization is disabled', () => {
    const {rerender, renderedIndices} = setup(false);
    expect(renderedIndices()).toEqual(disks.map((_, index) => index));
    expect(observers).toHaveLength(0);
    rerender({items: disks, virtualized: true});
    expect(renderedIndices()).toEqual([]);
    rerender({items: disks, virtualized: false});
    expect(renderedIndices()).toEqual(disks.map((_, index) => index));
});

test('preserves focus when refreshed identities enable virtualization', () => {
    const partialDisks = disks.map((disk, index) => (index === 0 ? {StringifiedId: ''} : disk));
    const {children, rerender, renderedIndices} = setup(false, partialDisks);
    const focusedLink = children[6].querySelector('button');

    act(() => focusedLink?.focus());
    expect(observers).toHaveLength(0);

    rerender({items: disks, virtualized: true});

    // Keep the keyboard target mounted before the observer reports any visible disks.
    expect(renderedIndices()).toEqual([5, 6, 7]);
    expect(observers).toHaveLength(1);
});
