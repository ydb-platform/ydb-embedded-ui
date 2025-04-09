import type React from 'react';

export interface FooterItem {
    id: string;
    text: string;
    url?: string;
    rightContent?: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
    disableClickHandler?: boolean;
}

export type FooterItemsArray = FooterItem[];
