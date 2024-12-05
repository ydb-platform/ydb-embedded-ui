import {HOUR_IN_SECONDS} from '../../../utils/constants';
import {calcUptimeInSeconds} from '../../../utils/dataFormatters/dataFormatters';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

// ==== Filters ====

export const filterNodesByUptime = <T extends {StartTime?: string}>(
    nodesList: T[] = [],
    nodesUptimeFilter: NodesUptimeFilterValues,
) => {
    if (nodesUptimeFilter === NodesUptimeFilterValues.All) {
        return nodesList;
    }
    return nodesList.filter(({StartTime}) => {
        return !StartTime || calcUptimeInSeconds(StartTime) < HOUR_IN_SECONDS;
    });
};
