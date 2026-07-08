import {VDisksGroupBy} from './groupBy';
import type {VDisksGroupByValue} from './groupBy';
import type {IconCalculator} from './iconCalculators';
import {
    calculateAllIcon,
    calculateCompactionIcon,
    calculateFrontQueuesIcon,
    calculateSpaceIcon,
    calculateStateIcon,
} from './iconCalculators';

/**
 * Get the appropriate icon calculator based on grouping mode
 */
export function getIconCalculator(groupBy: VDisksGroupByValue): IconCalculator {
    switch (groupBy) {
        case VDisksGroupBy.State:
            return calculateStateIcon;
        case VDisksGroupBy.Space:
            return calculateSpaceIcon;
        case VDisksGroupBy.FrontQueues:
            return calculateFrontQueuesIcon;
        case VDisksGroupBy.Compaction:
            return calculateCompactionIcon;
        case VDisksGroupBy.All:
        default:
            return calculateAllIcon;
    }
}
