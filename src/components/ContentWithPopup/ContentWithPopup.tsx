import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';

interface ContentWithPopupProps extends PopupProps {
    content: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    pinOnClick?: boolean;
}

export const ContentWithPopup = ({
    children,
    content,
    className,
    pinOnClick,
    hasArrow = true,
    placement = ['top', 'bottom'],
    ...props
}: ContentWithPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const [isPinned, setIsPinned] = React.useState(false);
    const anchor = React.useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    const pinPopup = () => {
        setIsPinned(true);
    };

    const unpinPopup = () => {
        setIsPinned(false);
    };

    return (
        <React.Fragment>
            <Popup
                anchorElement={anchor.current}
                open={isPinned || isPopupVisible}
                placement={placement}
                hasArrow={hasArrow}
                onOutsideClick={unpinPopup}
                {...props}
            >
                {content}
            </Popup>
            <span
                className={className}
                ref={anchor}
                onClick={pinOnClick ? pinPopup : undefined}
                onMouseEnter={showPopup}
                onMouseLeave={hidePopup}
            >
                {children}
            </span>
        </React.Fragment>
    );
};
