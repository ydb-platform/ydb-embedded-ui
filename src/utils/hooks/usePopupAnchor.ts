import React from 'react';

import debounce from 'lodash/debounce';

const DEBOUNCE_TIMEOUT = 100;

export function usePopupAnchor(onShowPopup?: VoidFunction, onHidePopup?: VoidFunction) {
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);
    const anchor = React.useRef<HTMLDivElement>(null);

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

    return {
        isPopupVisible,
        anchor,
        onMouseEnter,
        onMouseLeave,
        hidePopup,
    };
}
