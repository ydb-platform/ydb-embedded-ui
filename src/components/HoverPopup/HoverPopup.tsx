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
    renderPopupContent: (controls: {
        onClose: VoidFunction;
        holdOpen: () => VoidFunction;
    }) => React.ReactNode;
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
    const [hoverClosing, setHoverClosing] = React.useState(false);
    const dialogHoldRef = React.useRef<object | null>(null);

    const anchor = React.useRef<HTMLSpanElement>(null);
    const popupContent = React.useRef<HTMLDivElement>(null);
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

    const hidePopup = useEventHandler(() => {
        if (dialogHoldRef.current || isFocused) {
            return;
        }
        setHoverClosing(open && visibleAnchorRef.current === anchorElement);
        setIsPopupVisible(false);
        reportOpen(false);
    });

    const debouncedHandleHidePopup = React.useMemo(
        () => debounce(hidePopup, delayClose),
        [delayClose, hidePopup],
    );

    React.useEffect(() => {
        return () => {
            debouncedHandleShowPopup.cancel();
            debouncedHandleHidePopup.cancel();
            dialogHoldRef.current = null;
        };
    }, [debouncedHandleShowPopup, debouncedHandleHidePopup]);

    const closePopup = React.useCallback(() => {
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup.cancel();
        dialogHoldRef.current = null;
        setIsPopupVisible(false);
        setIsPopupContentHovered(false);
        setIsFocused(false);
        setHoverClosing(false);
        reportOpen(false, true);
        onClosePopup?.();
    }, [debouncedHandleHidePopup, debouncedHandleShowPopup, onClosePopup, reportOpen]);

    const hideClippedPopup = useEventHandler(() => {
        debouncedHandleShowPopup.cancel();
        setIsPopupContentHovered(false);
        setIsFocused(false);
        setHoverClosing(false);
        debouncedHandleHidePopup();
    });

    const internalOpen = isPopupVisible || isPopupContentHovered || isFocused;
    const open = Boolean(internalOpen || showPopup);

    const anchorElement = anchorRef?.current || anchor.current;
    // Release only this popup's hover source; a hovered peer can keep the pair open.
    const [isAnchorVisible, visibleAnchorRef] = useVisibleAnchor(
        anchorElement,
        open || hoverClosing,
        hideClippedPopup,
    );
    const container = getPopupScrollContainer(anchorElement);

    React.useEffect(() => {
        if (!hoverClosing || !anchorElement) {
            return undefined;
        }
        // Escape may close this popup through its paired sibling's handler.
        const preventHoverReturn = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setHoverClosing(false);
            }
        };
        const doc = anchorElement.ownerDocument;
        doc.addEventListener('keydown', preventHoverReturn, true);
        return () => doc.removeEventListener('keydown', preventHoverReturn, true);
    }, [anchorElement, hoverClosing]);

    const resumeHover = useEventHandler(() => {
        const contentHovered = Boolean(popupContent.current?.matches(':hover'));
        const hovered =
            visibleAnchorRef.current === anchorElement &&
            (anchorElement?.matches(':hover') || contentHovered);
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup.cancel();
        setIsFocused(false);
        setIsPopupContentHovered(Boolean(hovered && contentHovered));
        if (hovered) {
            setIsPopupVisible(true);
            reportOpen(true);
        } else {
            debouncedHandleHidePopup();
        }
    });

    const holdOpen = () => {
        const interaction = {};
        dialogHoldRef.current = interaction;
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup.cancel();
        setIsFocused(false);
        setIsPopupVisible(true);
        reportOpen(true);
        return () => {
            if (dialogHoldRef.current === interaction) {
                dialogHoldRef.current = null;
                resumeHover();
            }
        };
    };

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
            if ((!open && !hoverClosing) || visibleAnchorRef.current !== anchorElement) {
                return;
            }
            if (event.buttons === 0) {
                bringToFront();
            }
            debouncedHandleHidePopup.cancel();
            setHoverClosing(false);
            setIsPopupVisible(true);
            setIsPopupContentHovered(true);
            reportOpen(true);
        },
        [
            bringToFront,
            reportOpen,
            debouncedHandleHidePopup,
            open,
            hoverClosing,
            visibleAnchorRef,
            anchorElement,
        ],
    );

    const onPopupMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
        debouncedHandleHidePopup();
    }, [debouncedHandleHidePopup]);

    const onPopupContextMenu = React.useCallback(() => {
        if (dialogHoldRef.current || !open || visibleAnchorRef.current !== anchorElement) {
            return;
        }
        bringToFront();
        setIsFocused(true);
        reportOpen(true);
    }, [bringToFront, reportOpen, open, visibleAnchorRef, anchorElement]);

    const onPopupBlur = useEventHandler(() => {
        if (isFocused && !dialogHoldRef.current) {
            resumeHover();
        }
    });

    const onPopupEscapeKeyDown = React.useCallback(() => {
        if (!dialogHoldRef.current) {
            closePopup();
        }
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
                        } else if (reason === 'outside-press') {
                            onPopupBlur();
                        }
                    }}
                    placement={placement}
                    // Exiting popups must not expand the page when their anchors scroll offscreen.
                    strategy="fixed"
                    returnFocus={false}
                    hasArrow
                    open={open && isAnchorVisible}
                    onTransitionOutComplete={() => setHoverClosing(false)}
                    // bigger offset for easier switching to neighbour nodes
                    // matches the default offset for popup with arrow out of a sense of beauty
                    offset={offset || {mainAxis: 12, crossAxis: 0}}
                >
                    <div
                        ref={popupContent}
                        className={contentClassName}
                        onContextMenu={onPopupContextMenu}
                        onMouseEnter={onPopupMouseEnter}
                        onMouseLeave={onPopupMouseLeave}
                        onBlur={onPopupBlur}
                    >
                        <div className={YDB_POPOVER_CLASS_NAME}>
                            {renderPopupContent({onClose: closePopup, holdOpen})}
                        </div>
                    </div>
                </Popup>
            ) : null}
        </React.Fragment>
    );
};
