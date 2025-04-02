import type React from 'react';

export type Environment = 'production' | 'testing' | 'development';
export type InstallationType = 'external' | 'internal';

export interface TitleItem {
    url?: string;
    itemWrapper?: (item: TitleItem, text: string) => React.ReactNode;
}

export interface DocsItem {
    text: string | React.ReactNode;
    url?: string;
    hint?: string;
    itemWrapper?: (item: DocsItem) => React.ReactNode;
    linkExtra?: Record<string, any>;
}

export interface DocsDividerItem {
    type: 'divider';
}

export type DocsItems = DocsItem | DocsDividerItem;

export interface DocsCategory {
    title: string;
    items: DocsItems[];
}

export type ReservedFooterID =
    | 'aboutService'
    | 'supportChat'
    | 'telegram'
    | 'atushkaClub'
    | 'onboarding'
    | 'studyCourse'
    | 'shortCuts'
    | 'stackoverflow'
    | 'tracker'
    | 'partnerSearch'
    | 'freelancersHelp'
    | 'createRequest'
    | 'wikiFAQ'
    | 'swagger';

export interface ReservedFooterItem {
    id: ReservedFooterID;
    text: string;
    url?: string;
    content?: React.ReactNode;
    onClick?: () => void;
    disableClickHandler?: boolean;
}

export interface CustomFooterItem {
    id: 'custom';
    text: string;
    url?: string;
    content?: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
    disableClickHandler?: boolean;
}

export type FooterItem = ReservedFooterItem | CustomFooterItem;

export type LimitedFooterItemsArray = FooterItem[];

export interface ReservedDisplayFooterItem extends Omit<ReservedFooterItem, 'id'> {
    id: string;
    reservedId: ReservedFooterID;
    icon?: React.ReactNode;
    openSupportForm?: boolean;
}

export interface CustomDisplayFooterItem extends Omit<CustomFooterItem, 'id'> {
    id: string;
    openSupportForm?: boolean;
}

export type DisplayFooterItem = ReservedDisplayFooterItem | CustomDisplayFooterItem;

export interface ContactItem {
    id: string;
    text: string;
    url?: string;
    openSupportForm?: boolean;
}
