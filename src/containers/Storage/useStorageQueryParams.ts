import {useEffect} from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {storageGroupsGroupByParamSchema} from './PaginatedStorageGroupsTable/columns/constants';
import {storageNodesGroupByParamSchema} from './PaginatedStorageNodesTable/columns/constants';
import {STORAGE_SEARCH_PARAM_BY_TYPE} from './constants';

export function useStorageQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        type: StringParam,
        visible: StringParam,
        groupsSearch: StringParam,
        nodesSearch: StringParam,
        search: StringParam,
        uptimeFilter: StringParam,
        storageNodesGroupBy: StringParam,
        storageGroupsGroupBy: StringParam,
    });

    const storageType = storageTypeSchema.parse(queryParams.type);

    const visibleEntities = visibleEntitiesSchema.parse(queryParams.visible);
    const groupsSearchValue = queryParams.groupsSearch ?? '';
    const nodesSearchValue = queryParams.nodesSearch ?? '';
    const nodesUptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);

    const storageGroupsGroupByParam = storageGroupsGroupByParamSchema.parse(
        queryParams.storageGroupsGroupBy,
    );
    const storageNodesGroupByParam = storageNodesGroupByParamSchema.parse(
        queryParams.storageNodesGroupBy,
    );

    useEffect(() => {
        if (queryParams.search) {
            const patch: Record<string, string | undefined> = {search: undefined};
            patch[STORAGE_SEARCH_PARAM_BY_TYPE[storageType]] = queryParams.search;
            setQueryParams(patch, 'replaceIn');
        }
    }, [queryParams.search, storageType]);

    const handleTextFilterGroupsChange = (value: string) => {
        setQueryParams({groupsSearch: value || undefined}, 'replaceIn');
    };

    const handleTextFilterNodesChange = (value: string) => {
        setQueryParams({nodesSearch: value || undefined}, 'replaceIn');
    };

    const handleVisibleEntitiesChange = (value: VisibleEntities) => {
        setQueryParams({visible: value}, 'replaceIn');
    };

    const handleStorageTypeChange = (value: StorageType) => {
        setQueryParams({type: value}, 'replaceIn');
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };

    const handleStorageGroupsGroupByParamChange = (value: string) => {
        setQueryParams({storageGroupsGroupBy: value}, 'replaceIn');
    };

    const handleStorageNodesGroupByParamChange = (value: string) => {
        setQueryParams({storageNodesGroupBy: value}, 'replaceIn');
    };

    const handleShowAllGroups = () => {
        handleVisibleEntitiesChange('all');
    };

    const handleShowAllNodes = () => {
        handleVisibleEntitiesChange('all');
        handleUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    return {
        storageType,
        visibleEntities,
        groupsSearchValue,
        nodesSearchValue,
        nodesUptimeFilter,
        storageGroupsGroupByParam,
        storageNodesGroupByParam,

        handleTextFilterGroupsChange,
        handleTextFilterNodesChange,
        handleVisibleEntitiesChange,
        handleStorageTypeChange,
        handleUptimeFilterChange,

        handleStorageGroupsGroupByParamChange,
        handleStorageNodesGroupByParamChange,

        handleShowAllGroups,
        handleShowAllNodes,
    };
}
