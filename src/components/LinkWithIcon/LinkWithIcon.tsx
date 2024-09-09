import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Link} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {InternalLink} from '../InternalLink';

import './LinkWithIcon.scss';

const b = cn('ydb-link-with-icon');

interface ExternalLinkWithIconProps {
    title: string;
    url: string;
    external?: boolean;
    className?: string;
}

export const LinkWithIcon = ({
    title,
    url,
    external = true,
    className,
}: ExternalLinkWithIconProps) => {
    const linkContent = (
        <React.Fragment>
            {title}
            {'\u00a0'}
            <ArrowUpRightFromSquare />
        </React.Fragment>
    );

    if (external) {
        return (
            <Link href={url} target="_blank" className={b(null, className)}>
                {linkContent}
            </Link>
        );
    }

    return (
        <InternalLink to={url} className={b(null, className)}>
            {linkContent}
        </InternalLink>
    );
};
