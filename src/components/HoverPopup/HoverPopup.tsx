import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {cn} from '../../utils/cn';
import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {useEventHandler} from '../../utils/hooks/useEventHandler';

import {getPopupScrollContainer} from './getPopupScrollContainer';
import {usePopupPriority} from './usePopupPriority';

import './HoverPopup.scss';

const b = cn('ydb-hover-popup');
const DEBOUNCE_TIMEOUT = 100;

function useVisibleAnchor(
    anchorElement: HTMLElement | null,
    open: boolean,
    onHidden: VoidFunction,
) {
    const [visibleAnchor, setVisibleAnchor] = React.useState<HTMLElement | null>(null);

    React.useLayoutEffect(() => {
        setVisibleAnchor(null);
        if (!open || !anchorElement) {
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            setVisibleAnchor(entry.isIntersecting ? anchorElement : null);
            if (!entry.isIntersecting) {
                onHidden();
            }
        });
        observer.observe(anchorElement);
        return () => observer.disconnect();
    }, [anchorElement, onHidden, open]);

    return anchorElement !== null && visibleAnchor === anchorElement;
}

type HoverPopupProps = {
    children: React.ReactNode;
    renderPopupContent: (controls: {onClose: VoidFunction}) => React.ReactNode;
    showPopup?: boolean;
    anchorRef?: React.RefObject<HTMLElement>;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    delayOpen?: number;
    delayClose?: number;
    contentClassName?: string;
    keepOpenOnFocus?: boolean;
} & Pick<PopupProps, 'placement' | 'offset'>;

type PopupState = {
    visible: boolean;
    hovered: boolean;
    focused: boolean;
};

export const HoverPopup = ({
    children,
    renderPopupContent,
    showPopup,
    offset,
    anchorRef,
    onShowPopup,
    onHidePopup,
    placement = ['top', 'bottom', 'left', 'right'],
    contentClassName,
    keepOpenOnFocus = false,
    delayClose = DEBOUNCE_TIMEOUT,
    delayOpen = DEBOUNCE_TIMEOUT,
}: HoverPopupProps) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const popupStateRef = React.useRef<PopupState>({
        visible: false,
        hovered: false,
        focused: false,
    });

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

    const updatePopupState = useEventHandler((patch: Partial<PopupState>, force = false) => {
        const nextState = {...popupStateRef.current, ...patch};
        popupStateRef.current = nextState;

        const nextOpen = nextState.visible || nextState.hovered || nextState.focused;
        setInternalOpen(nextOpen);
        reportOpen(nextOpen, force);
    });

    const debouncedHandleShowPopup = React.useMemo(
        () =>
            debounce(() => {
                updatePopupState({visible: true});
            }, delayOpen),
        [delayOpen, updatePopupState],
    );

    const debouncedHandleHidePopup = React.useMemo(
        () =>
            debounce(() => {
                updatePopupState({visible: false});
            }, delayClose),
        [delayClose, updatePopupState],
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
        updatePopupState({visible: false, hovered: false, focused: false}, true);
    }, [debouncedHandleHidePopup, debouncedHandleShowPopup, updatePopupState]);

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
            if (event.buttons === 0) {
                bringToFront();
            }
            debouncedHandleHidePopup.cancel();
            updatePopupState({hovered: true});
        },
        [bringToFront, debouncedHandleHidePopup, updatePopupState],
    );

    const onPopupMouseLeave = React.useCallback(() => {
        updatePopupState({hovered: false});
        debouncedHandleHidePopup();
    }, [debouncedHandleHidePopup, updatePopupState]);

    const onPopupContextMenu = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            bringToFront();
            if (keepOpenOnFocus) {
                event.currentTarget.focus({preventScroll: true});
            }
            updatePopupState({focused: true});
        },
        [bringToFront, keepOpenOnFocus, updatePopupState],
    );

    const onPopupMouseDown = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (keepOpenOnFocus && event.button === 0) {
                // Plain text needs a focus owner too, so dragging a selection out keeps the card open.
                event.currentTarget.focus({preventScroll: true});
            }
        },
        [keepOpenOnFocus],
    );

    const onPopupFocus = React.useCallback(() => {
        bringToFront();
        if (keepOpenOnFocus) {
            debouncedHandleHidePopup.cancel();
            updatePopupState({focused: true});
        }
    }, [bringToFront, keepOpenOnFocus, debouncedHandleHidePopup, updatePopupState]);

    const onPopupBlur = React.useCallback(
        (event: React.FocusEvent<HTMLDivElement>) => {
            if (!keepOpenOnFocus || !event.currentTarget.contains(event.relatedTarget)) {
                updatePopupState({focused: false});
            }
        },
        [keepOpenOnFocus, updatePopupState],
    );

    const onPopupEscapeKeyDown = React.useCallback(() => {
        closePopup();
    }, [closePopup]);

    const open = Boolean(internalOpen || showPopup);

    const anchorElement = anchorRef?.current || anchor.current;
    const closeWhenAnchorHidden = React.useCallback(() => {
        // Release focus immediately; ordinary hover keeps its delayed close.
        if (popupStateRef.current.focused) {
            closePopup();
        }
    }, [closePopup]);
    const isAnchorVisible = useVisibleAnchor(anchorElement, open, closeWhenAnchorHidden);
    const container = getPopupScrollContainer(anchorElement);

    React.useEffect(() => {
        if (!keepOpenOnFocus || !internalOpen || !anchorElement) {
            return undefined;
        }

        const ownerDocument = anchorElement.ownerDocument;
        const onPointerDown = (event: PointerEvent) => {
            if (!popupStateRef.current.focused) {
                return;
            }
            const path = event.composedPath();
            if (
                path.includes(anchorElement) ||
                (popupContent.current && path.includes(popupContent.current))
            ) {
                return;
            }
            // Clicking a non-focusable object outside the card must clear its focus too.
            closePopup();
        };

        ownerDocument.addEventListener('pointerdown', onPointerDown, true);
        return () => ownerDocument.removeEventListener('pointerdown', onPointerDown, true);
    }, [anchorElement, closePopup, internalOpen, keepOpenOnFocus]);

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
                        ref={popupContent}
                        className={b('content', contentClassName)}
                        tabIndex={keepOpenOnFocus ? -1 : undefined}
                        onContextMenu={onPopupContextMenu}
                        onMouseDown={onPopupMouseDown}
                        onMouseEnter={onPopupMouseEnter}
                        onMouseLeave={onPopupMouseLeave}
                        onBlur={onPopupBlur}
                        onFocus={onPopupFocus}
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
