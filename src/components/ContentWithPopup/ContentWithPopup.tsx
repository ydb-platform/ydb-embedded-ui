import {ReactNode, useRef, useState} from 'react';

import {Popup, PopupProps} from '@gravity-ui/uikit';

interface ContentWithPopupProps extends PopupProps {
    content: ReactNode;
    className?: string;
    children?: ReactNode;
}

export const ContentWithPopup = ({
    children,
    content,
    className,
    hasArrow = true,
    placement = ['top', 'bottom'],
    ...props
}: ContentWithPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const anchor = useRef(null);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    return (
        <>
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
        </>
    );
};
