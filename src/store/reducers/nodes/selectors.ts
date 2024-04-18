import {EFlag} from '../../../types/api/enums';
import {HOUR_IN_SECONDS} from '../../../utils/constants';
import {calcUptimeInSeconds} from '../../../utils/dataFormatters/dataFormatters';
import {prepareSearchValue} from '../../../utils/filters';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {ProblemFilterValues} from '../settings/settings';
import type {ProblemFilterValue} from '../settings/types';

import type {NodesPreparedEntity} from './types';

// ==== Filters ====

const filterNodesByProblemsStatus = (
    nodesList: NodesPreparedEntity[] = [],
    problemFilter: ProblemFilterValue,
) => {
    if (problemFilter === ProblemFilterValues.ALL) {
        return nodesList;
    }

    return nodesList.filter(({SystemState}) => {
        return SystemState && SystemState !== EFlag.Green;
    });
};

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

const filterNodesBySearchValue = (nodesList: NodesPreparedEntity[] = [], searchValue: string) => {
    if (!searchValue) {
        return nodesList;
    }
    const re = prepareSearchValue(searchValue);

    return nodesList.filter((node) => {
        return node.Host ? re.test(node.Host) || re.test(String(node.NodeId)) : true;
    });
};

export function filterNodes(
    nodesList: NodesPreparedEntity[] = [],
    {
        uptimeFilter,
        searchValue,
        problemFilter,
    }: {
        uptimeFilter: NodesUptimeFilterValues;
        searchValue: string;
        problemFilter: ProblemFilterValue;
    },
) {
    let result = filterNodesByUptime(nodesList, uptimeFilter);
    result = filterNodesByProblemsStatus(result, problemFilter);
    result = filterNodesBySearchValue(result, searchValue);

    return result;
}
