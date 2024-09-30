import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useDelayed} from '../../utils/hooks/useDelayed';

import './TableSkeleton.scss';

const b = cn('table-skeleton');

interface TableSkeletonProps {
    className?: string;
    rows?: number;
    delay?: number;
}

export const TableSkeleton = ({rows = 2, delay = 600, className}: TableSkeletonProps) => {
    const [show] = useDelayed(delay);

    return (
        <div className={b('wrapper', {hidden: !show}, className)}>
            <div className={b('row')}>
                <Skeleton className={b('col-1')} />
                <Skeleton className={b('col-2')} />
                <Skeleton className={b('col-3')} />
                <Skeleton className={b('col-4')} />
                <Skeleton className={b('col-5')} />
            </div>
            {[...new Array(rows)].map((_, index) => (
                <div className={b('row')} key={`skeleton-row-${index}`}>
                    <Skeleton className={b('col-full')} />
                </div>
            ))}
        </div>
    );
};
