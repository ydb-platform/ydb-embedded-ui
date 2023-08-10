import {useMemo} from 'react';

import type {NodesGeneralRequestParams} from '../../store/reducers/nodes/types';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import {ProblemFilterValues} from '../../store/reducers/settings/settings';

import {HOUR_IN_SECONDS, USE_BACKEND_PARAMS_FOR_TABLES_KEY} from '../constants';
import {NodesUptimeFilterValues} from '../nodes';
import {useSetting} from './useSetting';

interface NodesRawRequestParams
    extends Omit<NodesGeneralRequestParams, 'problems_only' | 'uptime'> {
    problemFilter?: ProblemFilterValue;
    nodesUptimeFilter?: NodesUptimeFilterValues;
}

export const useNodesRequestParams = ({
    filter,
    problemFilter,
    nodesUptimeFilter,
    sortOrder,
    sortValue,
}: NodesRawRequestParams) => {
    const [useBackendParamsForTables] = useSetting<boolean>(USE_BACKEND_PARAMS_FOR_TABLES_KEY);

    // If backend params are enabled, update params value to use them in fetch request
    // Otherwise no params will be updated, no hooks that depend on requestParams will be triggered
    return useMemo(() => {
        if (useBackendParamsForTables) {
            const problemsOnly = problemFilter === ProblemFilterValues.PROBLEMS;
            const uptime =
                nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime
                    ? HOUR_IN_SECONDS
                    : undefined;

            return {
                filter,
                problems_only: problemsOnly,
                uptime,
                sortOrder,
                sortValue,
            };
        }
        return undefined;
    }, [useBackendParamsForTables, filter, problemFilter, nodesUptimeFilter, sortOrder, sortValue]);
};
