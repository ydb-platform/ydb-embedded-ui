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
export function isModifiedClickEvent(
    event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'button'>,
): boolean {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
