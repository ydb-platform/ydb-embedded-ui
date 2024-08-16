import {Skeleton as KitSkeleton} from '@gravity-ui/uikit';

import {useDelayed} from '../../utils/hooks/useDelayed';

interface SkeletonProps {
    delay?: number;
    className?: string;
}

export const Skeleton = ({delay = 600, className}: SkeletonProps) => {
    const show = useDelayed(delay);
    if (!show) {
        return null;
    }
    return <KitSkeleton className={className} />;
};
