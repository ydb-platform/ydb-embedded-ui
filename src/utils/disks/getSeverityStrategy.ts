import type {VDisksGroupByValue} from '../../containers/Storage/StorageExpertModePanel/constants';
import {VDisksGroupBy} from '../../containers/Storage/StorageExpertModePanel/constants';

import type {SeverityCalculator} from './severityCalculators';
import {
    calculateAllSeverity,
    calculateCompactionSeverity,
    calculateFrontQueuesSeverity,
    calculateSpaceSeverity,
    calculateStateSeverity,
} from './severityCalculators';

/**
 * Get the appropriate severity calculator based on grouping mode
 */
export function getSeverityCalculator(groupBy: VDisksGroupByValue): SeverityCalculator {
    switch (groupBy) {
        case VDisksGroupBy.State:
            return calculateStateSeverity;
        case VDisksGroupBy.Space:
            return calculateSpaceSeverity;
        case VDisksGroupBy.FrontQueues:
            return calculateFrontQueuesSeverity;
        case VDisksGroupBy.Compaction:
            return calculateCompactionSeverity;
        case VDisksGroupBy.All:
        default:
            return calculateAllSeverity;
    }
}
