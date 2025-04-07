import type React from 'react';

export interface DocsItem {
    text: string | React.ReactNode;
    url?: string;
}

export interface FooterItem {
    id: string;
    text: string;
    url?: string;
    rightContent?: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
    disableClickHandler?: boolean;
}

export type LimitedFooterItemsArray = FooterItem[];

export interface DisplayFooterItem extends Omit<FooterItem, 'id'> {
    id: string;
}
