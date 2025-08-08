import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';

const DEBOUNCE_TIMEOUT = 100;

type HoverPopupProps = {
    children: React.ReactNode;
    renderPopupContent: () => React.ReactNode;
    showPopup?: boolean;
    anchorRef?: React.RefObject<HTMLElement>;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    delayOpen?: number;
    delayClose?: number;
    contentClassName?: string;
} & Pick<PopupProps, 'placement' | 'offset'>;

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
                    anchorElement={anchorRef?.current || anchor.current}
                    onOpenChange={(_open, _event, reason) => {
                        if (reason === 'escape-key') {
                            onPopupEscapeKeyDown();
                        }
                    }}
                    placement={placement}
                    hasArrow
                    open
                    // bigger offset for easier switching to neighbour nodes
                    // matches the default offset for popup with arrow out of a sense of beauty
                    offset={offset || {mainAxis: 12, crossAxis: 0}}
                    className={YDB_POPOVER_CLASS_NAME}
                >
                    <div
                        className={contentClassName}
                        onContextMenu={onPopupContextMenu}
                        onMouseEnter={onPopupMouseEnter}
                        onMouseLeave={onPopupMouseLeave}
                        onBlur={onPopupBlur}
                    >
                        {renderPopupContent()}
                    </div>
                </Popup>
            ) : null}
        </React.Fragment>
    );
};
