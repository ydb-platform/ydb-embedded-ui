import React from 'react';

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

    const handleSearchQueryChange = React.useCallback(
        (value: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleUptimeFilterChange = React.useCallback(
        (value: NodesUptimeFilterValues) => {
            setQueryParams({uptimeFilter: value}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handlePeerRoleFilterChange = React.useCallback(
        (value: NodesPeerRole) => {
            setQueryParams({peerRole: value}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleGroupByParamChange = React.useCallback(
        (value: string) => {
            setQueryParams({nodesGroupBy: value}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleWithProblemsChange = React.useCallback(
        (value: boolean) => {
            setQueryParams({withProblems: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

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
