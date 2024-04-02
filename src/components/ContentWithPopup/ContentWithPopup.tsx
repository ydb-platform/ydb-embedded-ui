import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';

interface ContentWithPopupProps extends PopupProps {
    content: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

export const ContentWithPopup = ({
    children,
    content,
    className,
    hasArrow = true,
    placement = ['top', 'bottom'],
    ...props
}: ContentWithPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const anchor = React.useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    return (
        <React.Fragment>
            <Popup
                anchorRef={anchor}
                open={isPopupVisible}
                placement={placement}
                hasArrow={hasArrow}
                {...props}
            >
                {content}
            </Popup>
            <span
                className={className}
                ref={anchor}
                onMouseEnter={showPopup}
                onMouseLeave={hidePopup}
            >
                {children}
            </span>
        </React.Fragment>
    );
};
