import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './TableSkeleton.scss';

const b = cn('table-skeleton');

interface TableSkeletonProps {
    className?: string;
    rows?: number;
}

export const TableSkeleton = ({rows = 2, className}: TableSkeletonProps) => (
    <div className={b(null, className)}>
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
