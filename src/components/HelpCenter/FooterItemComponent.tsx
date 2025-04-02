import React from 'react';

import {Link} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import type {DisplayFooterItem} from './types';

const b = cn('help-center');

export function FooterItemComponent({
    item,
    footerItemClassName,
    children,
}: {
    item: DisplayFooterItem;
    footerItemClassName?: string;
    children?: React.ReactNode;
}) {
    const {text, url, content} = item;

    return url ? (
        <Link
            className={b('contact-item', {url: true}, footerItemClassName)}
            rel="noopener"
            target="_blank"
            href={url}
        >
            {children}
            {text}
            {content}
        </Link>
    ) : (
        <span className={b('contact-item', footerItemClassName)}>
            {children}
            {text}
            {content}
        </span>
    );
}
