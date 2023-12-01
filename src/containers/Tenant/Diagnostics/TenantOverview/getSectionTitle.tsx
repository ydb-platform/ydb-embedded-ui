import {InternalLink} from '../../../../components/InternalLink/InternalLink';

import i18n from './i18n';

interface GetSectionTitleParams {
    entity: string;
    postfix: string;
    prefix?: string;
    link?: string;
}

// Titles are formed by the principle "Top entities by parameter"
export const getSectionTitle = ({
    prefix = i18n('top'),
    entity,
    postfix,
    link,
}: GetSectionTitleParams) => {
    if (link) {
        return (
            <>
                {prefix} <InternalLink to={link}>{entity}</InternalLink> {postfix}
            </>
        );
    }

    return `${prefix} ${entity} ${postfix}`;
};
