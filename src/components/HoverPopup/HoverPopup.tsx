import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';

import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {useEventHandler} from '../../utils/hooks/useEventHandler';

import {getPopupScrollContainer} from './getPopupScrollContainer';

const DEBOUNCE_TIMEOUT = 100;

function useVisibleAnchor(anchorElement: HTMLElement | null, open: boolean) {
    const [visibleAnchor, setVisibleAnchor] = React.useState<HTMLElement | null>(null);

    React.useLayoutEffect(() => {
        setVisibleAnchor(null);
        if (!open || !anchorElement) {
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            setVisibleAnchor(entry.isIntersecting ? anchorElement : null);
        });
        observer.observe(anchorElement);
        return () => observer.disconnect();
    }, [anchorElement, open]);

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

    const onMouseEnter = () => {
        debouncedHandleHidePopup.cancel();
        debouncedHandleShowPopup();
    };

    const onMouseLeave = () => {
        debouncedHandleShowPopup.cancel();
        debouncedHandleHidePopup();
    };

    const onPopupMouseEnter = React.useCallback(() => {
        debouncedHandleHidePopup.cancel();
        updatePopupState({hovered: true});
    }, [debouncedHandleHidePopup, updatePopupState]);

    const onPopupMouseLeave = React.useCallback(() => {
        updatePopupState({hovered: false});
        debouncedHandleHidePopup();
    }, [debouncedHandleHidePopup, updatePopupState]);

    const onPopupContextMenu = React.useCallback(() => {
        updatePopupState({focused: true});
    }, [updatePopupState]);

    const onPopupFocus = React.useCallback(() => {
        if (keepOpenOnFocus) {
            debouncedHandleHidePopup.cancel();
            updatePopupState({focused: true});
        }
    }, [keepOpenOnFocus, debouncedHandleHidePopup, updatePopupState]);

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
    // Clipping a paired disk must not clear the shared hover state via onHidePopup.
    const isAnchorVisible = useVisibleAnchor(anchorElement, open);
    const container = getPopupScrollContainer(anchorElement);

    return (
        <React.Fragment>
            <span ref={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {children}
            </span>
            {anchorElement ? (
                <Popup
                    container={container}
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
