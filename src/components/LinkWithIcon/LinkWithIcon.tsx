import block from 'bem-cn-lite';

import {Link} from '@gravity-ui/uikit';

import {Icon} from '../Icon/Icon';
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
            <Icon name="external" viewBox={'0 0 16 16'} width={16} height={16} />
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
