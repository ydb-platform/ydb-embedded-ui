import React from 'react';

export function usePopupOpenState(hidePopup?: VoidFunction) {
    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const onMouseEnter = React.useCallback(() => {
        setIsPopupContentHovered(true);
    }, []);

    const onMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);
    }, []);

    const onContextMenu = React.useCallback(() => {
        setIsFocused(true);
    }, []);

    const onBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    const onEscapeKeyDown = React.useCallback(() => {
        setIsFocused(false);
        setIsPopupContentHovered(false);
        hidePopup?.();
    }, [hidePopup]);

    const open = isPopupContentHovered || isFocused;

    return {
        open,
        onMouseEnter,
        onMouseLeave,
        onContextMenu,
        onBlur,
        onEscapeKeyDown,
    };
}
