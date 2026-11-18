import React from 'react';

import type {FetchData} from '../../../components/PaginatedTable';
import {requestStorageData} from '../../../store/reducers/storage/requestStorageData';
import type {
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
} from '../../../store/reducers/storage/types';
import type {DataQualityMeta} from '../../../utils/dataIssues/types';
import {prepareSortValue} from '../../../utils/filters';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';

import {GROUPS_COLUMNS_TO_DATA_FIELDS, getStorageGroupsColumnSortField} from './columns/constants';

type GetStorageGroups = FetchData<
    PreparedStorageGroup,
    PreparedStorageGroupFilters,
    {},
    DataQualityMeta
>;

export function useGroupsGetter() {
    const fetchData: GetStorageGroups = React.useCallback(async (params) => {
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
        const dataFieldsRequired = getRequiredDataFields(columnsIds, GROUPS_COLUMNS_TO_DATA_FIELDS);

        const response = await requestStorageData({
            limit,
            offset,
            sort,
            filter: searchValue?.trim(),
            with: visibleEntities,
            database,
            nodeId,
            groupId,
            pDiskId,
            filter_group: filterGroup,
            filter_group_by: filterGroupBy,
            fieldsRequired: dataFieldsRequired,
        });

        return {
            data: response.groups || [],
            found: response.found || 0,
            total: response.total || 0,
            meta: {dataQuality: response.dataQuality},
        };
    }, []);

    return fetchData;
}
