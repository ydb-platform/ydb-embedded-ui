import type {LinkView} from '@gravity-ui/uikit';
import type {LinkProps} from 'react-router-dom';
import {Link} from 'react-router-dom';

import {cn} from '../../utils/cn';

import './InternalLink.scss';

const bLink = cn('g-link');
const ydbLink = cn('ydb-link');

interface InternalLinkProps extends Omit<LinkProps, 'to'> {
    to?: LinkProps['to'];
    view?: LinkView;
    as?: 'tab';
}

export const InternalLink = ({
    className,
    to,
    onClick,
    view = 'normal',
    as,
    ...props
}: InternalLinkProps) =>
    to ? (
        <Link
            to={to}
            onClick={onClick}
            className={bLink({view}, ydbLink({tab: as === 'tab'}, className))}
            {...props}
        />
    ) : (
        <span className={className} onClick={onClick}>
            {props.children}
        </span>
    );
