import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {ActionTooltip, Icon, Link} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {InternalLink} from '../InternalLink';

import './LinkWithIcon.scss';

const b = cn('ydb-link-with-icon');

interface ExternalLinkWithIconProps {
    title: string;
    url: string;
    external?: boolean;
    className?: string;
    icon?: IconData;
    description?: string;
}

export const LinkWithIcon = ({
    title,
    url,
    external = true,
    className,
    icon,
    description,
}: ExternalLinkWithIconProps) => {
    const linkContent = (
        <React.Fragment>
            {icon ? <Icon data={icon} size={16} /> : null}
            {icon ? '\u00a0' : null}
            {title}
            {'\u00a0'}
            <ArrowUpRightFromSquare />
        </React.Fragment>
    );

    const link = external ? (
        <Link href={url} target="_blank" className={b(null, className)}>
            {linkContent}
        </Link>
    ) : (
        <InternalLink to={url} className={b(null, className)}>
            {linkContent}
        </InternalLink>
    );

    if (description) {
        return (
            <ActionTooltip title={description} placement={['top', 'bottom']}>
                {link}
            </ActionTooltip>
        );
    }

    return link;
};
