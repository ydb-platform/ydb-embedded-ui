import {cn} from '../../../utils/cn';
export const b = cn('ydb-cluster-dashboard');

export interface ClusterMetricsCommonProps {
    value: number | string;
    capacity: number | string;
    colorizeProgress?: boolean;
    inverseColorize?: boolean;
    warningThreshold?: number;
    dangerThreshold?: number;
}
