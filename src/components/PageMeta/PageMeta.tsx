import {cn} from '../../utils/cn';
import {Skeleton} from '../Skeleton/Skeleton';

import './PageMeta.scss';

const b = cn('ydb-page-meta');

interface PageMetaProps {
    items: (string | undefined)[];
    loading?: boolean;
}

const separator = '\u00a0\u00a0\u00B7\u00a0\u00a0';

export function PageMeta({items, loading}: PageMetaProps) {
    const renderContent = () => {
        if (loading) {
            return <Skeleton className={b('skeleton')} />;
        }

        return items.filter((item) => Boolean(item)).join(separator);
    };

    return <div className={b('info')}>{renderContent()}</div>;
}
