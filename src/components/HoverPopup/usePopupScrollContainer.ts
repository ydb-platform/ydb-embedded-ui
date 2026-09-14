import React from 'react';

import {PopupScrollContainerContext} from './PopupScrollContainerContext';

export function usePopupScrollContainer(anchor: HTMLElement | null) {
    const containerRef = React.useContext(PopupScrollContainerContext);
    const container = containerRef?.current;
    const fullscreen = anchor?.ownerDocument.fullscreenElement;

    // Preserve existing portals outside the table's DOM / fullscreen boundary.
    return container &&
        anchor &&
        container.contains(anchor) &&
        (!fullscreen || fullscreen.contains(container))
        ? container
        : undefined;
}
