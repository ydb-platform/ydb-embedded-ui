import React from 'react';

// Only the previously active popup needs updating when another one is entered.
const activePopups = new WeakMap<Document, VoidFunction>();

export function usePopupPriority() {
    const [active, setActive] = React.useState(false);
    const documentRef = React.useRef<Document>();
    const deactivate = React.useCallback(() => setActive(false), []);
    const activate = React.useCallback(
        (element: HTMLElement | null) => {
            if (!element) {
                return;
            }
            const doc = element.ownerDocument;
            const previous = activePopups.get(doc);
            if (previous !== deactivate) {
                previous?.();
                activePopups.set(doc, deactivate);
            }
            documentRef.current = doc;
            setActive(true);
        },
        [deactivate],
    );

    React.useEffect(
        () => () => {
            const doc = documentRef.current;
            if (doc && activePopups.get(doc) === deactivate) {
                activePopups.delete(doc);
            }
        },
        [deactivate],
    );

    // Keep tooltips, menus and modal dialogs (Gravity UI's default 1000) above cards.
    return {activate, zIndex: active ? 999 : 998};
}
