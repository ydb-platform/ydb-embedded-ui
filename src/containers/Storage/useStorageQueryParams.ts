import React from 'react';

import {BooleanParam, StringParam, useQueryParam, useQueryParams} from 'use-query-params';

import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import {useSetting} from '../../utils/hooks';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {storageGroupsGroupByParamSchema} from './PaginatedStorageGroupsTable/columns/constants';
import {storageNodesGroupByParamSchema} from './PaginatedStorageNodesTable/columns/constants';
import {VDisksGroupBy, vdisksGroupBySchema} from './StorageExpertModePanel/constants';
import type {VDisksGroupByValue} from './StorageExpertModePanel/constants';
import {STORAGE_SEARCH_PARAM_BY_TYPE} from './constants';

interface StorageGroupByCleanupParams {
    blobMetricsEnabled: boolean;
    storageGroupsGroupBy?: string | null;
    storageNodesGroupBy?: string | null;
}

export function getStorageGroupByCleanupPatch({
    blobMetricsEnabled,
    storageGroupsGroupBy,
    storageNodesGroupBy,
}: StorageGroupByCleanupParams): Record<string, string | undefined> {
    const patch: Record<string, string | undefined> = {};

    if (blobMetricsEnabled) {
        if (storageGroupsGroupBy === 'Usage') {
            patch.storageGroupsGroupBy = undefined;
        }

        if (storageNodesGroupBy === 'DiskSpaceUsage') {
            patch.storageNodesGroupBy = undefined;
        }

        return patch;
    }

    if (storageGroupsGroupBy === 'CapacityAlert') {
        patch.storageGroupsGroupBy = undefined;
    }

    if (storageNodesGroupBy === 'CapacityAlert') {
        patch.storageNodesGroupBy = undefined;
    }

    return patch;
}

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
        storageExpertMode: BooleanParam,
        vdisksGroupBy: StringParam,
    });

    const [savedStorageType, setSavedStorageType] = useSetting<StorageType>(
        SETTING_KEYS.STORAGE_TYPE,
        STORAGE_TYPES.groups,
    );

    const blobMetricsEnabled = useBlobStorageCapacityMetricsEnabled();

    const storageType = storageTypeSchema.parse(queryParams.type ?? savedStorageType);

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

    const [savedStorageExpertMode, setSavedStorageExpertMode] = useSetting<boolean>(
        SETTING_KEYS.STORAGE_EXPERT_MODE,
    );

    const storageExpertMode = Boolean(queryParams.storageExpertMode ?? savedStorageExpertMode);

    const [savedVDisksGroupBy, setSavedVDisksGroupBy] = useSetting<VDisksGroupByValue>(
        SETTING_KEYS.STORAGE_VDISKS_GROUP_BY,
        VDisksGroupBy.State,
    );

    const vdisksGroupBy = vdisksGroupBySchema.parse(
        queryParams.vdisksGroupBy ?? savedVDisksGroupBy,
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

    const handleStorageGroupsGroupByParamChange = React.useCallback(
        (value: string) => {
            setQueryParams({storageGroupsGroupBy: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleStorageNodesGroupByParamChange = React.useCallback(
        (value: string) => {
            setQueryParams({storageNodesGroupBy: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleStorageExpertModeChange = React.useCallback(
        (value: boolean) => {
            setQueryParams({storageExpertMode: value ? true : undefined}, 'replaceIn');
            setSavedStorageExpertMode(value);
        },
        [setQueryParams, setSavedStorageExpertMode],
    );

    const handleVDisksGroupByChange = React.useCallback(
        (value: VDisksGroupByValue) => {
            setQueryParams({vdisksGroupBy: value}, 'replaceIn');
            setSavedVDisksGroupBy(value);
        },
        [setQueryParams, setSavedVDisksGroupBy],
    );

    const handleShowAllGroups = () => {
        handleVisibleEntitiesChange('all');
    };

    const handleShowAllNodes = () => {
        handleVisibleEntitiesChange('all');
        handleUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    React.useEffect(() => {
        const patch = getStorageGroupByCleanupPatch({
            blobMetricsEnabled,
            storageGroupsGroupBy: queryParams.storageGroupsGroupBy,
            storageNodesGroupBy: queryParams.storageNodesGroupBy,
        });

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
        storageExpertMode,
        vdisksGroupBy,

        handleTextFilterGroupsChange,
        handleTextFilterNodesChange,
        handleVisibleEntitiesChange,
        handleStorageTypeChange,
        handleUptimeFilterChange,

        handleStorageGroupsGroupByParamChange,
        handleStorageNodesGroupByParamChange,
        handleStorageExpertModeChange,
        handleVDisksGroupByChange,

        handleShowAllGroups,
        handleShowAllNodes,
    };
}

export function useIsStorageExpertMode() {
    const [storageExpertModeSettingEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE,
    );
    const [storageExpertModeQueryParam] = useQueryParam('storageExpertMode', BooleanParam);
    const [savedStorageExpertMode] = useSetting<boolean>(SETTING_KEYS.STORAGE_EXPERT_MODE);

    return (
        Boolean(storageExpertModeSettingEnabled) &&
        Boolean(storageExpertModeQueryParam ?? savedStorageExpertMode)
    );
}

export function useVDisksGroupByParam() {
    const [queryVDisksGroupBy] = useQueryParam('vdisksGroupBy', StringParam);
    const [savedVDisksGroupBy] = useSetting<VDisksGroupByValue>(
        SETTING_KEYS.STORAGE_VDISKS_GROUP_BY,
        VDisksGroupBy.State,
    );

    return React.useMemo(
        () => vdisksGroupBySchema.parse(queryVDisksGroupBy ?? savedVDisksGroupBy),
        [queryVDisksGroupBy, savedVDisksGroupBy],
    );
}

export function useSaveVDisksGroupBy() {
    const [queryVDisksGroupBy, setQueryVDisksGroupBy] = useQueryParam('vdisksGroupBy', StringParam);
    const [savedVDisksGroupBy] = useSetting<VDisksGroupByValue>(
        SETTING_KEYS.STORAGE_VDISKS_GROUP_BY,
        VDisksGroupBy.State,
    );

    const normalizedVDisksGroupBy = React.useMemo(
        () => vdisksGroupBySchema.parse(queryVDisksGroupBy ?? savedVDisksGroupBy),
        [queryVDisksGroupBy, savedVDisksGroupBy],
    );

    React.useEffect(() => {
        if (normalizedVDisksGroupBy !== queryVDisksGroupBy) {
            setQueryVDisksGroupBy(normalizedVDisksGroupBy, 'replaceIn');
        }
    }, [normalizedVDisksGroupBy, queryVDisksGroupBy, setQueryVDisksGroupBy]);
}

export function useSaveStorageExpertMode() {
    const [queryStorageExpertMode, setQueryStorageExpertMode] = useQueryParam(
        'storageExpertMode',
        BooleanParam,
    );
    const [savedStorageExpertMode] = useSetting<boolean>(SETTING_KEYS.STORAGE_EXPERT_MODE);

    const normalizedStorageExpertMode = React.useMemo(
        () => Boolean(queryStorageExpertMode ?? savedStorageExpertMode),
        [queryStorageExpertMode, savedStorageExpertMode],
    );

    React.useEffect(() => {
        if (normalizedStorageExpertMode !== Boolean(queryStorageExpertMode)) {
            setQueryStorageExpertMode(normalizedStorageExpertMode ? true : undefined, 'replaceIn');
        }
    }, [normalizedStorageExpertMode, queryStorageExpertMode, setQueryStorageExpertMode]);
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
            setQueryStorageType(normalizedStorageType, 'replaceIn');
        }
    }, [normalizedStorageType, queryStorageType, setQueryStorageType]);
}
