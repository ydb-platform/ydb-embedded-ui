/**
 * Minimal structural shape of a mouse click that this module cares about.
 * Compatible with both the DOM `MouseEvent` and React's `MouseEvent` (and any
 * other source that happens to carry these fields), without coupling the helper
 * to a specific framework typing.
 */
export interface ClickEventLike {
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}

/**
 * Returns true if a mouse click should be left to the browser's default behavior
 * rather than handled by app code. This covers:
 *
 * - modifier keys held (cmd/ctrl/shift/alt) — typically "open in new tab/window",
 *   "download", etc.;
 * - any non-primary mouse button (middle-click, right-click) — typically
 *   "open in new tab" or context menu.
 *
 * Use it in link/button click handlers that want to keep native anchor semantics
 * (cmd+click opens in a new tab) while still intercepting plain clicks for
 * client-side routing or in-app state changes.
 */
export function isModifiedClickEvent(event: ClickEventLike): boolean {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
