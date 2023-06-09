import block from 'bem-cn-lite';

import {Skeleton} from '@gravity-ui/uikit';

import './ClusterInfoSkeleton.scss';

const b = block('ydb-cluster-info-skeleton');

const SkeletonLabel = () => (
    <div className={b('label')}>
        <Skeleton className={b('label__text')} />
        <div className={b('label__dots')} />
    </div>
);

interface ClusterInfoSkeletonProps {
    className?: string;
    rows?: number;
}

export const ClusterInfoSkeleton = ({rows = 6, className}: ClusterInfoSkeletonProps) => (
    <div className={b(null, className)}>
        {[...new Array(rows)].map((_, index) => (
            <div className={b('row')} key={`skeleton-row-${index}`}>
                <SkeletonLabel />
                <Skeleton className={b('value')} />
            </div>
        ))}
        <div className={b('row')} key="versions">
            <SkeletonLabel />
            <Skeleton className={b('versions')} />
        </div>
    </div>
);
