import block from 'bem-cn-lite';

import {Link} from '@gravity-ui/uikit';

import {IconWrapper} from '../Icon/Icon';

import './ExternalLinkWithIcon.scss';

const b = block('ydb-external-link-with-icon');

interface ExternalLinkWithIconProps {
    title: string;
    url: string;
}

export const ExternalLinkWithIcon = ({title, url}: ExternalLinkWithIconProps) => {
    return (
        <Link href={url} target="_blank" className={b()}>
            {title}
            {'\u00a0'}
            <IconWrapper name="external" viewBox={'0 0 16 16'} width={16} height={16} />
        </Link>
    );
};
