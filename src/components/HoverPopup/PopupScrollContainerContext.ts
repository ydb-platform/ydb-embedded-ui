import React from 'react';

export const PopupScrollContainerContext = React.createContext<
    React.RefObject<HTMLElement> | undefined
>(undefined);
