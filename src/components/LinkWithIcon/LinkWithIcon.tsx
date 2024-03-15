import block from 'bem-cn-lite';

import {Link} from '@gravity-ui/uikit';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';

import {InternalLink} from '../InternalLink';
import './LinkWithIcon.scss';

const b = block('ydb-link-with-icon');

interface ExternalLinkWithIconProps {
    title: string;
    url: string;
    external?: boolean;
}

export const LinkWithIcon = ({title, url, external = true}: ExternalLinkWithIconProps) => {
    const linkContent = (
        <>
            {title}
            {'\u00a0'}
            <ArrowUpRightFromSquare />
        </>
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
