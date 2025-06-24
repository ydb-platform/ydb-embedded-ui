import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useDelayed} from '../../utils/hooks/useDelayed';

import './TableSkeleton.scss';

const b = cn('table-skeleton');

interface TableSkeletonProps {
    className?: string;
    rows?: number;
    delay?: number;
    columns?: number;
    showHeader?: boolean;
}

export const TableSkeleton = ({
    rows = 2,
    delay = 600,
    className,
    columns = 5,
    showHeader = true,
}: TableSkeletonProps) => {
    const [show] = useDelayed(delay);

    const renderHeaderRow = () => {
        if (!showHeader) {
            return null;
        }

        return (
            <div className={b('row')}>
                {[...new Array(columns)].map((_, index) => (
                    <Skeleton key={`header-col-${index}`} className={b(`col-${index + 1}`)} />
                ))}
            </div>
        );
    };

    return (
        <div className={b('wrapper', {hidden: !show}, className)}>
            {renderHeaderRow()}
            {[...new Array(rows)].map((_, index) => (
                <div className={b('row')} key={`skeleton-row-${index}`}>
                    <Skeleton className={b('col-full')} />
                </div>
            ))}
        </div>
    );
};
