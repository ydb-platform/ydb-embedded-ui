import React from 'react';

import {Flex, Link} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';

import type {DisplayFooterItem} from './types';

const b = cn('help-center');

export function FooterItemComponent({
    item,
    children,
}: {
    item: DisplayFooterItem;
    children?: React.ReactNode;
}) {
    const {text, url, rightContent} = item;

    return url ? (
        <Link className={b('contact-item', {url: true})} rel="noopener" target="_blank" href={url}>
            {text}
            {rightContent}
        </Link>
    ) : (
        <span className={b('contact-item')}>
            {children}
            <Flex width="100%" justifyContent="space-between">
                {text}
                {rightContent}
            </Flex>
        </span>
    );
}
