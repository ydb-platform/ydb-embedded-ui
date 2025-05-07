import {StringParam, useQueryParams} from 'use-query-params';

import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {storageGroupsGroupByParamSchema} from './PaginatedStorageGroupsTable/columns/constants';
import {storageNodesGroupByParamSchema} from './PaginatedStorageNodesTable/columns/constants';

export function useStorageQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        type: StringParam,
        visible: StringParam,
        search: StringParam,
        uptimeFilter: StringParam,
        storageNodesGroupBy: StringParam,
        storageGroupsGroupBy: StringParam,
    });

    const storageType = storageTypeSchema.parse(queryParams.type);

    const visibleEntities = visibleEntitiesSchema.parse(queryParams.visible);
    const searchValue = queryParams.search ?? '';
    const nodesUptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);

    const storageGroupsGroupByParam = storageGroupsGroupByParamSchema.parse(
        queryParams.storageGroupsGroupBy,
    );
    const storageNodesGroupByParam = storageNodesGroupByParamSchema.parse(
        queryParams.storageNodesGroupBy,
    );

    const handleTextFilterChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
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
        searchValue,
        nodesUptimeFilter,
        storageGroupsGroupByParam,
        storageNodesGroupByParam,

        handleTextFilterChange,
        handleVisibleEntitiesChange,
        handleStorageTypeChange,
        handleUptimeFilterChange,

        handleStorageGroupsGroupByParamChange,
        handleStorageNodesGroupByParamChange,

        handleShowAllGroups,
        handleShowAllNodes,
    };
}
