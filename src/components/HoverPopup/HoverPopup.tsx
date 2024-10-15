import React from 'react';

import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {cn} from '../../utils/cn';

import './HoverPopup.scss';

const b = cn('hover-popup');

interface HoverPopupProps {
    children: React.ReactNode;
    popupContent: React.ReactNode;
    showPopup?: boolean;
    offset?: [number, number];
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
}

export const HoverPopup = ({
    children,
    popupContent,
    showPopup,
    offset,
    onShowPopup,
    onHidePopup,
}: HoverPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const anchor = React.useRef<HTMLDivElement>(null);

    const DEBOUNCE_TIMEOUT = 100;

    const debouncedHandleShowPopup = React.useMemo(
        () =>
            debounce(() => {
                setIsPopupVisible(true);
                onShowPopup?.();
            }, DEBOUNCE_TIMEOUT),
        [onShowPopup],
    );

    const hidePopup = React.useCallback(() => {
        setIsPopupVisible(false);
        onHidePopup?.();
    }, [onHidePopup]);

    const debouncedHandleHidePopup = React.useMemo(
        () => debounce(hidePopup, DEBOUNCE_TIMEOUT),
        [hidePopup],
    );

    const onMouseEnter = debouncedHandleShowPopup;

    const onMouseLeave = () => {
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup();
    };

    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const onPopupMouseEnter = React.useCallback(() => {
        setIsPopupContentHovered(true);
    }, []);

    const onPopupMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
    }, []);

    const onPopupContextMenu = React.useCallback(() => {
        setIsFocused(true);
    }, []);

    const onPopupBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    const onPopupEscapeKeyDown = React.useCallback(() => {
        setIsFocused(false);
        setIsPopupContentHovered(false);
        hidePopup();
    }, [hidePopup]);

    const open = isPopupVisible || showPopup || isPopupContentHovered || isFocused;

    return (
        <React.Fragment>
            <div ref={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {children}
            </div>
            <Popup
                contentClassName={b()}
                anchorRef={anchor}
                open={open}
                onMouseEnter={onPopupMouseEnter}
                onMouseLeave={onPopupMouseLeave}
                onEscapeKeyDown={onPopupEscapeKeyDown}
                onBlur={onPopupBlur}
                placement={['top', 'bottom']}
                hasArrow
                // bigger offset for easier switching to neighbour nodes
                // matches the default offset for popup with arrow out of a sense of beauty
                offset={offset || [0, 12]}
            >
                <div onContextMenu={onPopupContextMenu}>{popupContent}</div>
            </Popup>
        </React.Fragment>
    );
};
