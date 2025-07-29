import {Card, Flex, Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {useDelayed} from '../../utils/hooks/useDelayed';

import './QueriesActivitySkeleton.scss';

const b = cn('queries-activity-skeleton');

interface QueriesActivitySkeletonProps {
    delay?: number;
}

export function QueriesActivitySkeleton({delay = 600}: QueriesActivitySkeletonProps) {
    const [show] = useDelayed(delay);

    if (!show) {
        return null;
    }

    return (
        <div className={b()}>
            <Card className={b('card')} type="container" view="outlined">
                <Flex direction="row" gap={4} className={b('content')}>
                    <Flex>
                        <Skeleton className={b('title')} />
                    </Flex>
                    <Flex wrap alignItems="center" gap={1} className={b('stats')}>
                        <Skeleton className={b('label')} />
                        <Skeleton className={b('label')} />
                        <Skeleton className={b('label')} />
                        <Skeleton className={b('button')} />
                    </Flex>
                </Flex>
            </Card>
        </div>
    );
}
