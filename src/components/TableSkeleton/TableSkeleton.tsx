import { FC } from 'react';
import block from 'bem-cn-lite';
import { Skeleton } from '@yandex-cloud/uikit';

import './TableSkeleton.scss';

const b = block('table-skeleton');

interface TableSkeletonProps {
    className?: string;
    rows?: number;
}

export const TableSkeleton: FC<TableSkeletonProps> = ({ rows = 2, className }) => (
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
