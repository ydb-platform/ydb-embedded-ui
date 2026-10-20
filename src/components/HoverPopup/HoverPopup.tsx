import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';

import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {useEventHandler} from '../../utils/hooks/useEventHandler';

import {getPopupScrollContainer} from './getPopupScrollContainer';
import {usePopupPriority} from './usePopupPriority';

const DEBOUNCE_TIMEOUT = 100;

type HoverPopupProps = {
    children: React.ReactNode;
    renderPopupContent: (controls: {
        onClose: VoidFunction;
        holdOpen: () => VoidFunction;
    }) => React.ReactNode;
    // Controlled visibility; omit to use local hover state.
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
    const [localOpen, setLocalOpen] = React.useState(false);
    const open = showPopup ?? localOpen;
    const [hoverClosing, setHoverClosing] = React.useState(false);
    const observeAnchor = open || hoverClosing;
    const timer = React.useRef<ReturnType<typeof setTimeout>>();
    const keepOpen = React.useRef<'context-menu' | object | null>(null);
    const anchor = React.useRef<HTMLSpanElement>(null);
    const popupContent = React.useRef<HTMLDivElement>(null);
    const anchorElement = anchorRef?.current || anchor.current;
    const [visibleAnchor, setVisibleAnchor] = React.useState<HTMLElement | null>(null);
    const visibleAnchorRef = React.useRef<HTMLElement | null>(null);
    const {activate, zIndex} = usePopupPriority();

    const applyOpen = useEventHandler((next: boolean, reason: 'hover' | 'dismiss') => {
        setHoverClosing(
            !next && reason === 'hover' && open && visibleAnchorRef.current === anchorElement,
        );
        if (showPopup === undefined) {
            setLocalOpen(next);
        }
        (next ? onShowPopup : onHidePopup)?.();
    });
    const requestOpen = useEventHandler(
        (next: boolean, delay = 0, reason: 'hover' | 'dismiss' = 'hover') => {
            clearTimeout(timer.current);
            if (!next && keepOpen.current) {
                return;
            }
            if (delay) {
                timer.current = setTimeout(() => applyOpen(next, reason), delay);
            } else {
                applyOpen(next, reason);
            }
        },
    );

    React.useEffect(
        () => () => {
            clearTimeout(timer.current);
            keepOpen.current = null;
        },
        [],
    );

    const closePopup = () => {
        keepOpen.current = null;
        requestOpen(false, 0, 'dismiss');
        onClosePopup?.();
    };
    const leave = () => requestOpen(false, delayClose);
    React.useLayoutEffect(() => {
        setVisibleAnchor(null);
        visibleAnchorRef.current = null;
        if (!observeAnchor || !anchorElement) {
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            // Mouse events can arrive before React renders this visibility change.
            visibleAnchorRef.current = entry.isIntersecting ? anchorElement : null;
            setVisibleAnchor(visibleAnchorRef.current);
            if (!entry.isIntersecting) {
                setHoverClosing(false);
                if (keepOpen.current === 'context-menu') {
                    keepOpen.current = null;
                }
                requestOpen(false, delayClose, 'dismiss');
            }
        });
        observer.observe(anchorElement);
        // Escape can dismiss this popup through its paired sibling's handler.
        const preventHoverReturn = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setHoverClosing(false);
            }
        };
        const doc = anchorElement.ownerDocument;
        doc.addEventListener('keydown', preventHoverReturn, true);
        return () => {
            observer.disconnect();
            doc.removeEventListener('keydown', preventHoverReturn, true);
        };
    }, [anchorElement, observeAnchor, delayClose, requestOpen]);
    const resumeHover = useEventHandler(() => {
        const hovered =
            visibleAnchorRef.current === anchorElement &&
            (anchorElement?.matches(':hover') || popupContent.current?.matches(':hover'));
        requestOpen(Boolean(hovered), hovered ? 0 : delayClose);
    });
    const holdOpen = () => {
        const interaction = {};
        keepOpen.current = interaction;
        requestOpen(true);
        return () => {
            if (keepOpen.current === interaction) {
                keepOpen.current = null;
                resumeHover();
            }
        };
    };
    const enter = (event: React.MouseEvent, delay = 0) => {
        if (event.buttons === 0) {
            activate(anchorElement);
        }
        requestOpen(true, delay);
    };

    return (
        <React.Fragment>
            <span
                ref={anchor}
                onMouseEnter={(event) => {
                    if (event.buttons === 0) {
                        enter(event, delayOpen);
                    }
                }}
                onMouseLeave={leave}
            >
                {children}
            </span>
            {anchorElement ? (
                <Popup
                    container={getPopupScrollContainer(anchorElement)}
                    zIndex={zIndex}
                    // Keep portal typography when the page uses a different font.
                    floatingStyles={{fontFamily: 'var(--g-text-body-font-family)'}}
                    anchorElement={anchorElement}
                    onOpenChange={(_open, _event, reason) => {
                        if (
                            reason === 'escape-key' &&
                            (!keepOpen.current || keepOpen.current === 'context-menu')
                        ) {
                            closePopup();
                        } else if (
                            reason === 'outside-press' &&
                            keepOpen.current === 'context-menu'
                        ) {
                            // Release this pin without dismissing a hovered peer or its dialog.
                            keepOpen.current = null;
                            resumeHover();
                        }
                    }}
                    placement={placement}
                    strategy="fixed"
                    returnFocus={false}
                    hasArrow
                    open={open && visibleAnchor === anchorElement}
                    onTransitionOutComplete={() => setHoverClosing(false)}
                    offset={offset || {mainAxis: 12, crossAxis: 0}}
                >
                    <div
                        ref={popupContent}
                        className={contentClassName}
                        onContextMenu={() => {
                            if (open && visibleAnchorRef.current === anchorElement) {
                                keepOpen.current ||= 'context-menu';
                                activate(anchorElement);
                                requestOpen(true);
                            }
                        }}
                        onMouseEnter={(event) => {
                            if (
                                (open || hoverClosing) &&
                                visibleAnchorRef.current === anchorElement
                            ) {
                                enter(event);
                            }
                        }}
                        onMouseLeave={leave}
                        onBlur={() => {
                            if (keepOpen.current === 'context-menu') {
                                keepOpen.current = null;
                                resumeHover();
                            }
                        }}
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
