import {StringParam, useQueryParams} from 'use-query-params';

import {useViewerNodesHandlerHasGroupingBySystemState} from '../../store/reducers/capabilities/hooks';
import type {NodesGroupByField} from '../../types/api/nodes';
import type {NodesUptimeFilterValues} from '../../utils/nodes';
import {nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {parseNodesGroupByParam} from './columns/constants';

export function useNodesPageQueryParams(groupByParams: NodesGroupByField[] | undefined) {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        search: StringParam,
        nodesGroupBy: StringParam,
    });

    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';

    const systemStateGroupingAvailable = useViewerNodesHandlerHasGroupingBySystemState();
    const groupByParam = parseNodesGroupByParam(
        queryParams.nodesGroupBy,
        groupByParams ?? [],
        systemStateGroupingAvailable,
    );

    const handleSearchQueryChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
    };
    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };
    const handleGroupByParamChange = (value: string) => {
        setQueryParams({nodesGroupBy: value}, 'replaceIn');
    };

    return {
        uptimeFilter,
        searchValue,
        groupByParam,

        handleSearchQueryChange,
        handleUptimeFilterChange,
        handleGroupByParamChange,
    };
}
