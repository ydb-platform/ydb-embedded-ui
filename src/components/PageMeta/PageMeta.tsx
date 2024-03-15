import {cn} from '../../utils/cn';
import './PageMeta.scss';

const b = cn('ydb-page-meta');

interface PageMetaProps {
    items: (string | undefined)[];
    className?: string;
}

export function PageMeta({items, className}: PageMetaProps) {
    return (
        <div className={b(null, className)}>
            {items.filter((item) => Boolean(item)).join('\u00a0\u00a0\u00B7\u00a0\u00a0')}
        </div>
    );
}
