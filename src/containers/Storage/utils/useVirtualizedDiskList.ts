import React from 'react';

interface DiskItem {
    StringifiedId?: string;
}

const MIN_VIRTUALIZED_DISKS_COUNT = 10;

function getDiskKey(disks: readonly DiskItem[], index: number) {
    return disks[index]?.StringifiedId || index;
}

export function useVirtualizedDiskList(disks: readonly DiskItem[], enabled = true) {
    const shouldVirtualize = enabled && disks.length >= MIN_VIRTUALIZED_DISKS_COUNT;
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const pendingFocusRef = React.useRef<{element: HTMLDivElement; fromEnd: boolean}>();
    const [visibleKeys, setVisibleKeys] = React.useState<Set<string | number>>(() => new Set());
    const [lastFocusedKey, setLastFocusedKey] = React.useState<string | number>();
    const lastFocusedIndex = disks.findIndex(
        (_, index) => getDiskKey(disks, index) === lastFocusedKey,
    );

    React.useEffect(() => {
        if (lastFocusedKey !== undefined && lastFocusedIndex === -1) {
            setLastFocusedKey(undefined);
        }
    }, [lastFocusedIndex, lastFocusedKey]);

    const placeholderProps = React.useMemo<React.HTMLAttributes<HTMLDivElement>>(
        () => ({
            tabIndex: 0,
            onFocus: (event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }
                const index = Array.from(containerRef.current?.children ?? []).findIndex(
                    (element) => element.contains(event.currentTarget),
                );
                if (index !== -1) {
                    pendingFocusRef.current = {
                        element: event.currentTarget,
                        fromEnd: index === disks.length - 1,
                    };
                    setLastFocusedKey(getDiskKey(disks, index));
                }
            },
        }),
        [disks],
    );

    React.useLayoutEffect(() => {
        const pendingFocus = pendingFocusRef.current;
        pendingFocusRef.current = undefined;
        if (!pendingFocus || document.activeElement !== pendingFocus.element) {
            return;
        }
        // Mount the boundary disk before handing focus to its first/last link.
        const links = pendingFocus.element.querySelectorAll<HTMLAnchorElement>('a[href]');
        const link = pendingFocus.fromEnd ? links[links.length - 1] : links[0];
        link?.focus();
    });

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) {
            return undefined;
        }

        const onFocus = (event: FocusEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }
            const index = Array.from(container.children).findIndex((element) =>
                element.contains(target),
            );
            if (index !== -1) {
                setLastFocusedKey(getDiskKey(disks, index));
            }
        };
        container.addEventListener('focusin', onFocus);

        if (!shouldVirtualize) {
            return () => container.removeEventListener('focusin', onFocus);
        }

        // Each disk keeps one direct child as its sized placeholder.
        const keysByElement = new Map(
            Array.from(container.children, (element, index) => [element, getDiskKey(disks, index)]),
        );
        const intersectingKeys = new Set<string | number>();
        let active = true;
        const observer = new IntersectionObserver((entries) => {
            if (!active) {
                return;
            }
            for (const entry of entries) {
                const key = keysByElement.get(entry.target);
                if (key === undefined) {
                    continue;
                }
                if (entry.isIntersecting) {
                    intersectingKeys.add(key);
                } else {
                    intersectingKeys.delete(key);
                }
            }
            const next = new Set(intersectingKeys);
            setVisibleKeys((previous) => {
                return next.size === previous.size && [...next].every((key) => previous.has(key))
                    ? previous
                    : next;
            });
        });
        keysByElement.forEach((_, element) => observer.observe(element));

        return () => {
            active = false;
            observer.disconnect();
            container.removeEventListener('focusin', onFocus);
        };
    }, [disks, enabled, shouldVirtualize]);

    const shouldRenderDisk = (index: number) =>
        !shouldVirtualize ||
        visibleKeys.has(getDiskKey(disks, index)) ||
        // Keep neighbors for scrolling and Tab/Shift+Tab navigation.
        visibleKeys.has(getDiskKey(disks, index - 1)) ||
        visibleKeys.has(getDiskKey(disks, index + 1)) ||
        // Keep the last keyboard target reachable when returning from the next row.
        (lastFocusedIndex !== -1 && Math.abs(index - lastFocusedIndex) <= 1);

    return {
        containerRef,
        shouldRenderDisk,
        getPlaceholderProps: (index: number) =>
            shouldVirtualize &&
            !shouldRenderDisk(index) &&
            (index === 0 || index === disks.length - 1)
                ? placeholderProps
                : undefined,
    };
}
