import React from 'react';

export function usePopupScrollContainer(anchor: HTMLElement | null, open: boolean) {
    const [layout, setLayout] = React.useState<{
        container?: HTMLElement;
        maxHeight?: number;
    }>({});

    React.useLayoutEffect(() => {
        if (!open || !anchor) {
            return undefined;
        }
        const doc = anchor.ownerDocument;
        const view = doc.defaultView;
        if (!view) {
            return undefined;
        }
        let container = anchor.parentElement;
        while (container && !/(auto|scroll)/.test(view.getComputedStyle(container).overflowY)) {
            // A portal outside the fullscreen element would not be visible.
            if (container === doc.fullscreenElement) {
                break;
            }
            container = container.parentElement;
        }
        if (!container) {
            // Preserve the application's PortalProvider when there is no local scroll container.
            setLayout({});
            return undefined;
        }
        const scrollContainer = container;
        const updateLayout = () => {
            const bounds = scrollContainer.getBoundingClientRect();
            const target = anchor.getBoundingClientRect();
            // Leave room for the popup offset, arrow and border.
            const maxHeight = Math.max(
                0,
                Math.max(
                    target.top - Math.max(bounds.top, 0),
                    Math.min(bounds.bottom, view.innerHeight) - target.bottom,
                ) - 16,
            );
            setLayout((previous) =>
                previous.container === scrollContainer && previous.maxHeight === maxHeight
                    ? previous
                    : {container: scrollContainer, maxHeight},
            );
        };
        const observer = new ResizeObserver(updateLayout);
        observer.observe(scrollContainer);
        observer.observe(anchor);
        doc.addEventListener('scroll', updateLayout, true);
        view.addEventListener('resize', updateLayout);
        updateLayout();
        return () => {
            observer.disconnect();
            doc.removeEventListener('scroll', updateLayout, true);
            view.removeEventListener('resize', updateLayout);
        };
    }, [anchor, open]);

    return layout;
}
