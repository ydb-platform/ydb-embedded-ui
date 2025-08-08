import {StringParam, useQueryParams} from 'use-query-params';

import {useViewerNodesHandlerHasGroupingBySystemState} from '../../store/reducers/capabilities/hooks';
import type {NodesGroupByField, NodesPeerRole} from '../../types/api/nodes';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import type {NodesUptimeFilterValues} from '../../utils/nodes';
import {nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {parseNodesPeerRoleFilter} from './PeerRoleFilter/utils';
import {parseNodesGroupByParam} from './columns/constants';

export function useNodesPageQueryParams(groupByParams: NodesGroupByField[] | undefined) {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        peerRole: StringParam,
        search: StringParam,
        nodesGroupBy: StringParam,
    });

    const isViewerUser = useIsViewerUser();

    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';
    const peerRoleFilter = isViewerUser
        ? parseNodesPeerRoleFilter(queryParams.peerRole)
        : 'database';

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
    const handlePeerRoleFilterChange = (value: NodesPeerRole) => {
        setQueryParams({peerRole: value}, 'replaceIn');
    };
    const handleGroupByParamChange = (value: string) => {
        setQueryParams({nodesGroupBy: value}, 'replaceIn');
    };

    return {
        uptimeFilter,
        searchValue,
        peerRoleFilter,
        groupByParam,

        handleSearchQueryChange,
        handleUptimeFilterChange,
        handlePeerRoleFilterChange,
        handleGroupByParamChange,
    };
}
