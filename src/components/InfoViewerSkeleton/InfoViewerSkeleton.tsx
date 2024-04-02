import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './InfoViewerSkeleton.scss';

const b = cn('ydb-info-viewer-skeleton');

const SkeletonLabel = () => (
    <div className={b('label')}>
        <Skeleton className={b('label__text')} />
        <div className={b('label__dots')} />
    </div>
);

interface InfoViewerSkeletonProps {
    className?: string;
    rows?: number;
}

export const InfoViewerSkeleton = ({rows = 8, className}: InfoViewerSkeletonProps) => (
    <div className={b(null, className)}>
        {[...new Array(rows)].map((_, index) => (
            <div className={b('row')} key={`skeleton-row-${index}`}>
                <SkeletonLabel />
                <Skeleton className={b('value')} />
            </div>
        ))}
    </div>
);
