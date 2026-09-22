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
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

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
    }, [debouncedHandleHidePopup, debouncedHandleShowPopup, reportOpen]);

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
        setIsPopupContentHovered(true);
        reportOpen(true);
    }, [reportOpen, debouncedHandleHidePopup]);

    const onPopupMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
        debouncedHandleHidePopup();
    }, [debouncedHandleHidePopup]);

    const onPopupContextMenu = React.useCallback(() => {
        setIsFocused(true);
        reportOpen(true);
    }, [reportOpen]);

    const onPopupFocus = React.useCallback(() => {
        if (keepOpenOnFocus) {
            debouncedHandleHidePopup.cancel();
            setIsFocused(true);
            reportOpen(true);
        }
    }, [keepOpenOnFocus, debouncedHandleHidePopup, reportOpen]);

    const onPopupBlur = React.useCallback(
        (event: React.FocusEvent<HTMLDivElement>) => {
            if (!keepOpenOnFocus || !event.currentTarget.contains(event.relatedTarget)) {
                setIsFocused(false);
            }
        },
        [keepOpenOnFocus],
    );

    const onPopupEscapeKeyDown = React.useCallback(() => {
        closePopup();
    }, [closePopup]);

    const internalOpen = isPopupVisible || isPopupContentHovered || isFocused;
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
