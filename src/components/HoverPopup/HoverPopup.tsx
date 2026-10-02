import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {useEventHandler} from '../../utils/hooks/useEventHandler';

import {getPopupScrollContainer} from './getPopupScrollContainer';
import {usePopupPriority} from './usePopupPriority';

const DEBOUNCE_TIMEOUT = 100;

function useVisibleAnchor(
    anchorElement: HTMLElement | null,
    open: boolean,
    onHidden: VoidFunction,
) {
    const [visibleAnchor, setVisibleAnchor] = React.useState<HTMLElement | null>(null);
    // Mouse events can arrive before React renders the observer's next visibility state.
    const visibleAnchorRef = React.useRef<HTMLElement | null>(null);

    React.useLayoutEffect(() => {
        setVisibleAnchor(null);
        visibleAnchorRef.current = null;
        if (!open || !anchorElement) {
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            visibleAnchorRef.current = entry.isIntersecting ? anchorElement : null;
            setVisibleAnchor(visibleAnchorRef.current);
            if (!entry.isIntersecting) {
                onHidden();
            }
        });
        observer.observe(anchorElement);
        return () => observer.disconnect();
    }, [anchorElement, open, onHidden]);

    return [anchorElement !== null && visibleAnchor === anchorElement, visibleAnchorRef] as const;
}

type HoverPopupProps = {
    children: React.ReactNode;
    renderPopupContent: (controls: {onClose: VoidFunction}) => React.ReactNode;
    showPopup?: boolean;
    anchorRef?: React.RefObject<HTMLElement>;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    onClosePopup?: VoidFunction;
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
    onClosePopup,
    placement = ['top', 'bottom', 'left', 'right'],
    contentClassName,
    delayClose = DEBOUNCE_TIMEOUT,
    delayOpen = DEBOUNCE_TIMEOUT,
}: HoverPopupProps) => {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const anchor = React.useRef<HTMLSpanElement>(null);
    const {activate, zIndex} = usePopupPriority();
    const bringToFront = useEventHandler(() => activate(anchorRef?.current || anchor.current));

    const reportedOpenRef = React.useRef(false);

    const reportOpen = useEventHandler((nextOpen: boolean, force = false) => {
        if (!force && reportedOpenRef.current === nextOpen) {
            return;
        }

        reportedOpenRef.current = nextOpen;

        if (nextOpen) {
            onShowPopup?.();
        } else {
            onHidePopup?.();
        }
    });

    const debouncedHandleShowPopup = React.useMemo(
        () =>
            debounce(() => {
                setIsPopupVisible(true);
                reportOpen(true);
            }, delayOpen),
        [delayOpen, reportOpen],
    );

    const hidePopup = React.useCallback(() => {
        setIsPopupVisible(false);
    }, []);

    const debouncedHandleHidePopup = React.useMemo(
        () =>
            debounce(() => {
                hidePopup();
                reportOpen(false);
            }, delayClose),
        [delayClose, reportOpen, hidePopup],
    );

    React.useEffect(() => {
        return () => {
            debouncedHandleShowPopup.cancel();
            debouncedHandleHidePopup.cancel();
        };
    }, [debouncedHandleShowPopup, debouncedHandleHidePopup]);

    const closePopup = React.useCallback(() => {
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup.cancel();
        setIsPopupVisible(false);
        setIsPopupContentHovered(false);
        setIsFocused(false);
        reportOpen(false, true);
        onClosePopup?.();
    }, [debouncedHandleHidePopup, debouncedHandleShowPopup, onClosePopup, reportOpen]);

    const hideClippedPopup = useEventHandler(() => {
        debouncedHandleShowPopup.cancel();
        setIsPopupContentHovered(false);
        setIsFocused(false);
        debouncedHandleHidePopup();
    });

    const internalOpen = isPopupVisible || isPopupContentHovered || isFocused;
    const open = Boolean(internalOpen || showPopup);

    const anchorElement = anchorRef?.current || anchor.current;
    // Release only this popup's hover source; a hovered peer can keep the pair open.
    const [isAnchorVisible, visibleAnchorRef] = useVisibleAnchor(
        anchorElement,
        open,
        hideClippedPopup,
    );
    const container = getPopupScrollContainer(anchorElement);

    const onMouseEnter = (event: React.MouseEvent<HTMLSpanElement>) => {
        if (event.buttons !== 0) {
            return;
        }
        bringToFront();
        debouncedHandleHidePopup.cancel();
        debouncedHandleShowPopup();
    };

    const onMouseLeave = () => {
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup();
    };

    const onPopupMouseEnter = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            // An exiting popup can still receive events during its close animation.
            if (!open || visibleAnchorRef.current !== anchorElement) {
                return;
            }
            if (event.buttons === 0) {
                bringToFront();
            }
            debouncedHandleHidePopup.cancel();
            setIsPopupContentHovered(true);
            reportOpen(true);
        },
        [bringToFront, reportOpen, debouncedHandleHidePopup, open, visibleAnchorRef, anchorElement],
    );

    const onPopupMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
        debouncedHandleHidePopup();
    }, [debouncedHandleHidePopup]);

    const onPopupContextMenu = React.useCallback(() => {
        if (!open || visibleAnchorRef.current !== anchorElement) {
            return;
        }
        bringToFront();
        setIsFocused(true);
        reportOpen(true);
    }, [bringToFront, reportOpen, open, visibleAnchorRef, anchorElement]);

    const onPopupBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    const onPopupEscapeKeyDown = React.useCallback(() => {
        closePopup();
    }, [closePopup]);

    return (
        <React.Fragment>
            <span ref={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {children}
            </span>
            {anchorElement ? (
                <Popup
                    container={container}
                    zIndex={zIndex}
                    // Keep portal typography when the page uses a different font.
                    floatingStyles={{fontFamily: 'var(--g-text-body-font-family)'}}
                    anchorElement={anchorElement}
                    onOpenChange={(_open, _event, reason) => {
                        if (reason === 'escape-key') {
                            onPopupEscapeKeyDown();
                        }
                    }}
                    placement={placement}
                    // Exiting popups must not expand the page when their anchors scroll offscreen.
                    strategy="fixed"
                    returnFocus={false}
                    hasArrow
                    open={open && isAnchorVisible}
                    // bigger offset for easier switching to neighbour nodes
                    // matches the default offset for popup with arrow out of a sense of beauty
                    offset={offset || {mainAxis: 12, crossAxis: 0}}
                >
                    <div
                        className={contentClassName}
                        onContextMenu={onPopupContextMenu}
                        onMouseEnter={onPopupMouseEnter}
                        onMouseLeave={onPopupMouseLeave}
                        onBlur={onPopupBlur}
                    >
                        <div className={YDB_POPOVER_CLASS_NAME}>
                            {renderPopupContent({onClose: closePopup})}
                        </div>
                    </div>
                </Popup>
            ) : null}
        </React.Fragment>
    );
};
