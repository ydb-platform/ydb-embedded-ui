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
}

export const LinkWithIcon = ({title, url, external = true}: ExternalLinkWithIconProps) => {
    const linkContent = (
        <React.Fragment>
            {title}
            {'\u00a0'}
            <ArrowUpRightFromSquare />
        </React.Fragment>
    );

    if (external) {
        return (
            <Link href={url} target="_blank" className={b()}>
                {linkContent}
            </Link>
        );
    }

    return (
        <InternalLink to={url} className={b()}>
            {linkContent}
        </InternalLink>
    );
};
