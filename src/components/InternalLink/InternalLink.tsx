import {Link, LinkProps} from 'react-router-dom';
import cn from 'bem-cn-lite';

const bLink = cn('yc-link');

interface InternalLinkProps extends Omit<LinkProps, 'to'> {
    to?: LinkProps['to'];
}

export const InternalLink = ({className, to, onClick, ...props}: InternalLinkProps) =>
    to ? (
        <Link to={to} onClick={onClick} className={bLink({view: 'normal'}, className)} {...props} />
    ) : (
        <span className={className} onClick={onClick}>
            {props.children}
        </span>
    );
