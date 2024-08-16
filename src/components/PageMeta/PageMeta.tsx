import {Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {AutoRefreshControl} from '../AutoRefreshControl/AutoRefreshControl';
import {Skeleton} from '../Skeleton/Skeleton';

import './PageMeta.scss';

const b = cn('ydb-page-meta');

interface PageMetaProps {
    items: (string | undefined)[];
    className?: string;
    loading?: boolean;
}

export function PageMeta({items, loading}: PageMetaProps) {
    const renderContent = () => {
        if (loading) {
            return <Skeleton className={b('skeleton')} />;
        }

        return items.filter((item) => Boolean(item)).join('\u00a0\u00a0\u00B7\u00a0\u00a0');
    };

    return <div className={b('info')}>{renderContent()}</div>;
}

export function PageMetaWithAutorefresh({className, ...rest}: PageMetaProps) {
    return (
        <Flex
            gap={1}
            alignItems="center"
            justifyContent="space-between"
            className={b(null, className)}
        >
            <PageMeta {...rest} />
            <AutoRefreshControl />
        </Flex>
    );
}
