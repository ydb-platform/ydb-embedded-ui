import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {cn} from '../../utils/cn';

import './HoverPopup.scss';

const b = cn('hover-popup');

const DEBOUNCE_TIMEOUT = 100;

type HoverPopupProps = {
    children: React.ReactNode;
    renderPopupContent: () => React.ReactNode;
    showPopup?: boolean;
    offset?: [number, number];
    anchorRef?: React.RefObject<HTMLElement>;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    delayOpen?: number;
    delayClose?: number;
} & Pick<PopupProps, 'placement' | 'contentClassName'>;

export const HoverPopup = ({
    children,
    renderPopupContent,
    showPopup,
    offset,
    anchorRef,
    onShowPopup,
    onHidePopup,
    placement = ['top', 'bottom'],
    contentClassName,
    delayClose = DEBOUNCE_TIMEOUT,
    delayOpen = DEBOUNCE_TIMEOUT,
}: HoverPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const anchor = React.useRef<HTMLDivElement>(null);

    const debouncedHandleShowPopup = React.useMemo(
        () =>
            debounce(() => {
                setIsPopupVisible(true);
                onShowPopup?.();
            }, delayOpen),
        [onShowPopup, delayOpen],
    );

    const hidePopup = React.useCallback(() => {
        setIsPopupVisible(false);
        onHidePopup?.();
    }, [onHidePopup]);

    const debouncedHandleHidePopup = React.useMemo(
        () => debounce(hidePopup, delayClose),
        [hidePopup, delayClose],
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
            <span ref={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {children}
            </span>
            {open ? (
                <Popup
                    contentClassName={b(null, contentClassName)}
                    anchorRef={anchorRef || anchor}
                    onMouseEnter={onPopupMouseEnter}
                    onMouseLeave={onPopupMouseLeave}
                    onEscapeKeyDown={onPopupEscapeKeyDown}
                    onBlur={onPopupBlur}
                    placement={placement}
                    hasArrow
                    open
                    // bigger offset for easier switching to neighbour nodes
                    // matches the default offset for popup with arrow out of a sense of beauty
                    offset={offset || [0, 12]}
                >
                    <div onContextMenu={onPopupContextMenu}>{renderPopupContent()}</div>
                </Popup>
            ) : null}
        </React.Fragment>
    );
};
