import {Selector, createSelector} from 'reselect';

import {EFlag} from '../../../types/api/enums';
import {calcUptimeInSeconds} from '../../../utils/dataFormatters/dataFormatters';
import {HOUR_IN_SECONDS} from '../../../utils/constants';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {prepareSearchValue} from '../../../utils/filters';

import type {ProblemFilterValue} from '../settings/types';
import type {NodesPreparedEntity, NodesStateSlice} from './types';
import {ProblemFilterValues} from '../settings/settings';

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

// ==== Simple selectors ====

const selectNodesUptimeFilter = (state: NodesStateSlice) => state.nodes.nodesUptimeFilter;
const selectSearchValue = (state: NodesStateSlice) => state.nodes.searchValue;
const selectNodesList = (state: NodesStateSlice) => state.nodes.data;

// ==== Complex selectors ====

export const selectFilteredNodes: Selector<NodesStateSlice, NodesPreparedEntity[] | undefined> =
    createSelector(
        [
            selectNodesList,
            selectNodesUptimeFilter,
            selectSearchValue,
            (state) => state.settings.problemFilter,
        ],
        (nodesList, uptimeFilter, searchValue, problemFilter) => {
            let result = filterNodesByUptime(nodesList, uptimeFilter);
            result = filterNodesByProblemsStatus(result, problemFilter);
            result = filterNodesBySearchValue(result, searchValue);

            return result;
        },
    );
