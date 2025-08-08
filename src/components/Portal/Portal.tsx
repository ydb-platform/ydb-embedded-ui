import * as React from 'react';

import ReactDOM from 'react-dom';

export interface PortalProps {
    container: HTMLElement;
    children?: React.ReactNode;
    disablePortal?: boolean;
}

export function Portal({container, children, disablePortal}: PortalProps) {
    const containerNode = container;

    if (disablePortal) {
        return <React.Fragment>{children}</React.Fragment>;
    }

    return containerNode ? ReactDOM.createPortal(children, containerNode) : null;
}
