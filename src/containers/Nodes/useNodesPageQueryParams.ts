import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

import {useViewerNodesHandlerHasGroupingBySystemState} from '../../store/reducers/capabilities/hooks';
import type {NodesGroupByField, NodesPeerRole} from '../../types/api/nodes';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import type {NodesUptimeFilterValues} from '../../utils/nodes';
import {nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {parseNodesPeerRoleFilter} from './PeerRoleFilter/utils';
import {parseNodesGroupByParam} from './columns/constants';

export function useNodesPageQueryParams(
    groupByParams: NodesGroupByField[] | undefined,
    withPeerRoleFilter: boolean | undefined,
) {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        peerRole: StringParam,
        search: StringParam,
        nodesGroupBy: StringParam,
        withProblems: BooleanParam,
    });

    const isViewerUser = useIsViewerUser();

    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';
    const withProblems = Boolean(queryParams.withProblems);

    let peerRoleFilter: NodesPeerRole | undefined;

    // Do not add peerRoleFilter on Cluster page Network tab
    if (withPeerRoleFilter) {
        peerRoleFilter = isViewerUser
            ? parseNodesPeerRoleFilter(queryParams.peerRole, 'database')
            : 'database';
    }

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
    const handleWithProblemsChange = (value: boolean) => {
        setQueryParams({withProblems: value || undefined}, 'replaceIn');
    };

    return {
        uptimeFilter,
        searchValue,
        peerRoleFilter,
        groupByParam,
        withProblems,

        handleSearchQueryChange,
        handleUptimeFilterChange,
        handlePeerRoleFilterChange,
        handleGroupByParamChange,
        handleWithProblemsChange,
    };
}
