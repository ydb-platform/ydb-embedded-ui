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
    };
}
