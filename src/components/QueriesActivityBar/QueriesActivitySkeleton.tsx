import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './QueriesActivitySkeleton.scss';

const b = cn('queries-activity-skeleton');

export function QueriesActivitySkeleton() {
    return <Skeleton className={b('skeleton')} />;
}
