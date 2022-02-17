import React from 'react';

export interface AsideHeaderMenuItem {
    id: string;
    title: string;
    tooltipText?: string;
    icon?: SVGIconData;
    iconSize?: number | string;
    link?: string;
    current?: boolean;
    pinned?: boolean;
    onItemClick?: (item: AsideHeaderMenuItem, isCollapsed: boolean) => void;
    itemWrapper?: (
        node: React.ReactNode,
        item: AsideHeaderMenuItem,
        isCollapsed: boolean,
        isCompact: boolean,
    ) => React.ReactNode;
}

export interface AsideHeaderLocalStorage {
    isCompact?: boolean;
}
