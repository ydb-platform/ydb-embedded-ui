import React from 'react';

import {InternalLink} from '../../../../components/InternalLink/InternalLink';

import i18n from './i18n';

interface GetSectionTitleParams {
    entity: string;
    postfix: string;
    prefix?: string;
    link?: string;
    onClick?: () => void;
}

// Titles are formed by the principle "Top entities by parameter"
export const getSectionTitle = ({
    prefix = i18n('top'),
    entity,
    postfix,
    link,
    onClick,
}: GetSectionTitleParams) => {
    if (link) {
        return (
            <React.Fragment>
                {prefix}{' '}
                <InternalLink to={link} onClick={onClick}>
                    {entity}
                </InternalLink>{' '}
                {postfix}
            </React.Fragment>
        );
    }

    return `${prefix} ${entity} ${postfix}`;
};
