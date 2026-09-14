export function getPopupScrollContainer(anchor: HTMLElement | null) {
    if (!anchor) {
        return undefined;
    }
    const doc = anchor.ownerDocument;
    let parent = anchor.parentElement;
    while (parent) {
        if (
            parent === doc.fullscreenElement ||
            parent.classList.contains('ydb-fullscreen_fullscreen') ||
            (/auto|scroll/.test(doc.defaultView?.getComputedStyle(parent).overflowY ?? '') &&
                parent.scrollHeight > parent.clientHeight)
        ) {
            // Document scrolling already works through the default portal.
            return parent === doc.scrollingElement ? undefined : parent;
        }
        parent = parent.parentElement;
    }
    return undefined;
}
