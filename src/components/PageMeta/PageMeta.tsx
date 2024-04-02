import {Skeleton} from '@gravity-ui/uikit';
import {cn} from '../../utils/cn';
import './PageMeta.scss';

const b = cn('ydb-page-meta');

interface PageMetaProps {
    items: (string | undefined)[];
    className?: string;
    loading?: boolean;
}

export function PageMeta({items, loading, className}: PageMetaProps) {
    const renderContent = () => {
        if (loading) {
            return <Skeleton className={b('skeleton')} />;
        }

        return items.filter((item) => Boolean(item)).join('\u00a0\u00a0\u00B7\u00a0\u00a0');
    };

    return <div className={b(null, className)}>{renderContent()}</div>;
}
