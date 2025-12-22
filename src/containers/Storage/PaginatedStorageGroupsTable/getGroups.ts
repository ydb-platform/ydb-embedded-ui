import React from 'react';

import type {FetchData} from '../../../components/PaginatedTable';
import {requestStorageData} from '../../../store/reducers/storage/requestStorageData';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import {prepareSortValue} from '../../../utils/filters';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';

import {GROUPS_COLUMNS_TO_DATA_FIELDS, getStorageGroupsColumnSortField} from './columns/constants';

type GetStorageGroups = FetchData<PreparedStorageGroup, PreparedStorageGroupFilters>;

export function useGroupsGetter(shouldUseGroupsHandler: boolean) {
    const fetchData: GetStorageGroups = React.useCallback(
        async (params) => {
            const {limit, offset, sortParams, filters, columnsIds} = params;
            const {sortOrder, columnId} = sortParams ?? {};
            const {
                searchValue,
                visibleEntities,
                database,
                nodeId,
                groupId,
                pDiskId,
                filterGroup,
                filterGroupBy,
            } = filters ?? {};

            const sortField = getStorageGroupsColumnSortField(columnId);
            const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

            const dataFieldsRequired = getRequiredDataFields(
                columnsIds,
                GROUPS_COLUMNS_TO_DATA_FIELDS,
            );

            const {groups, found, total} = await requestStorageData({
                limit,
                offset,
                sort,
                filter: searchValue,
                with: visibleEntities,
                database,
                nodeId,
                groupId,
                pDiskId,
                filter_group: filterGroup,
                filter_group_by: filterGroupBy,
                fieldsRequired: dataFieldsRequired,
                shouldUseGroupsHandler,
            });

            return {
                data: groups || [],
                found: found || 0,
                total: total || 0,
            };
        },
        [shouldUseGroupsHandler],
    );

    return fetchData;
}
