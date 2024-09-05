import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useDelayed} from '../../utils/hooks/useDelayed';

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
    delay?: number;
}

export const InfoViewerSkeleton = ({rows = 8, className, delay = 600}: InfoViewerSkeletonProps) => {
    const [show] = useDelayed(delay);
    let skeletons: React.ReactNode = (
        <React.Fragment>
            <SkeletonLabel />
            <Skeleton className={b('value')} />
        </React.Fragment>
    );
    if (!show) {
        skeletons = null;
    }
    return (
        <div className={b(null, className)}>
            {[...new Array(rows)].map((_, index) => (
                <div className={b('row')} key={`skeleton-row-${index}`}>
                    {skeletons}
                </div>
            ))}
        </div>
    );
};
