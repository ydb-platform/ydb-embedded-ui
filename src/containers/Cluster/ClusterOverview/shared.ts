import {cn} from '../../../utils/cn';
export const b = cn('ydb-cluster-dashboard');

export interface ClusterMetricsBaseProps {
    colorizeProgress?: boolean;
    inverseColorize?: boolean;
    warningThreshold?: number;
    dangerThreshold?: number;
    collapsed?: boolean;
    percentPrecision?: number;
}

export interface ClusterMetricsCommonProps extends ClusterMetricsBaseProps {
    value: number | string;
    capacity: number | string;
}
