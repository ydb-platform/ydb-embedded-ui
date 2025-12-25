import React from 'react';

import {StringParam, useQueryParam, useQueryParams} from 'use-query-params';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import {useSetting} from '../../utils/hooks';
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

    const [_savedStorageType, setSavedStorageType] = useSetting<StorageType>(
        SETTING_KEYS.STORAGE_TYPE,
        STORAGE_TYPES.groups,
    );

    const [blobMetricsEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS,
        false,
    );

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

    React.useEffect(() => {
        if (queryParams.search) {
            const patch: Record<string, string | undefined> = {search: undefined};
            patch[STORAGE_SEARCH_PARAM_BY_TYPE[storageType]] = queryParams.search;
            setQueryParams(patch, 'replaceIn');
        }
    }, [queryParams.search, storageType, setQueryParams]);

    const handleTextFilterGroupsChange = (value: string) => {
        setQueryParams({groupsSearch: value || undefined}, 'replaceIn');
    };

    const handleTextFilterNodesChange = (value: string) => {
        setQueryParams({nodesSearch: value || undefined}, 'replaceIn');
    };

    const handleVisibleEntitiesChange = (value: VisibleEntities) => {
        setQueryParams({visible: value}, 'replaceIn');
    };

    const handleStorageTypeChange = React.useCallback(
        (value: StorageType) => {
            setQueryParams({type: value}, 'replaceIn');
            setSavedStorageType(value);
        },
        [setQueryParams, setSavedStorageType],
    );

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };

    const handleStorageGroupsGroupByParamChange = (value: string) => {
        setQueryParams({storageGroupsGroupBy: value || undefined}, 'replaceIn');
    };

    const handleStorageNodesGroupByParamChange = (value: string) => {
        setQueryParams({storageNodesGroupBy: value || undefined}, 'replaceIn');
    };

    const handleShowAllGroups = () => {
        handleVisibleEntitiesChange('all');
    };

    const handleShowAllNodes = () => {
        handleVisibleEntitiesChange('all');
        handleUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    React.useEffect(() => {
        if (blobMetricsEnabled) {
            return;
        }

        const patch: Record<string, string | undefined> = {};

        if (queryParams.storageGroupsGroupBy === 'CapacityAlert') {
            patch.storageGroupsGroupBy = undefined;
        }

        if (queryParams.storageNodesGroupBy === 'CapacityAlert') {
            patch.storageNodesGroupBy = undefined;
        }

        if (Object.keys(patch).length > 0) {
            setQueryParams(patch, 'replaceIn');
        }
    }, [
        blobMetricsEnabled,
        queryParams.storageGroupsGroupBy,
        queryParams.storageNodesGroupBy,
        setQueryParams,
    ]);

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

export function useSaveStorageType() {
    const [queryStorageType, setQueryStorageType] = useQueryParam('type', StringParam);
    const [savedStorageType] = useSetting<StorageType>(
        SETTING_KEYS.STORAGE_TYPE,
        STORAGE_TYPES.groups,
    );

    const normalizedStorageType = React.useMemo(
        () => storageTypeSchema.parse(queryStorageType ?? savedStorageType),
        [queryStorageType, savedStorageType],
    );

    React.useEffect(() => {
        if (normalizedStorageType !== queryStorageType) {
            setQueryStorageType(normalizedStorageType);
        }
    }, [normalizedStorageType, queryStorageType, setQueryStorageType]);
}
