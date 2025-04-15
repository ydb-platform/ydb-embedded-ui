import React from 'react';

import type {Settings} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import type {InfoViewerItem} from '../../../../components/InfoViewer';
import type {KeyValueRow} from '../../../../types/api/query';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../utils/generateHash';
import {prepareBackendSortFieldsFromTableSort, useTableSort} from '../../../../utils/hooks';
import {formatToMs, parseUsToMs} from '../../../../utils/timeParsers';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import {
    QUERIES_COLUMNS_IDS,
    getRunningQueriesColumnSortField,
    getTopQueriesColumnSortField,
} from './columns/constants';
import i18n from './i18n';

export const TOP_QUERIES_TABLE_SETTINGS: Settings = {
    ...QUERY_TABLE_SETTINGS,
    disableSortReset: true,
};

export function useTopQueriesSort() {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: QUERIES_COLUMNS_IDS.CPUTime,
        initialSortOrder: DataTable.DESCENDING,
        multiple: true,
        fixedOrderType: DataTable.DESCENDING,
    });

    return {
        tableSort,
        handleTableSort,
        backendSort: React.useMemo(
            () => prepareBackendSortFieldsFromTableSort(tableSort, getTopQueriesColumnSortField),
            [tableSort],
        ),
    };
}

export function createQueryInfoItems(data: KeyValueRow): InfoViewerItem[] {
    const items: InfoViewerItem[] = [];

    if (data.QueryText) {
        items.push({
            label: i18n('query-details.query-hash'),
            value: generateHash(String(data.QueryText)),
        });
    }

    if (data.CPUTimeUs !== undefined) {
        items.push({
            label: i18n('query-details.cpu-time'),
            value: formatToMs(parseUsToMs(data.CPUTimeUs ?? undefined)),
        });
    }

    if (data.Duration !== undefined) {
        items.push({
            label: i18n('query-details.duration'),
            value: formatToMs(parseUsToMs(data.Duration ?? undefined)),
        });
    }

    if (data.ReadBytes !== undefined) {
        items.push({
            label: i18n('query-details.read-bytes'),
            value: formatNumber(data.ReadBytes),
        });
    }

    if (data.RequestUnits !== undefined) {
        items.push({
            label: i18n('query-details.request-units'),
            value: formatNumber(data.RequestUnits),
        });
    }

    if (data.EndTime) {
        items.push({
            label: i18n('query-details.end-time'),
            value: formatDateTime(new Date(data.EndTime as string).getTime()),
        });
    }

    if (data.ReadRows !== undefined) {
        items.push({
            label: i18n('query-details.read-rows'),
            value: formatNumber(data.ReadRows),
        });
    }

    if (data.UserSID) {
        items.push({
            label: i18n('query-details.user-sid'),
            value: data.UserSID,
        });
    }

    if (data.ApplicationName) {
        items.push({
            label: i18n('query-details.application-name'),
            value: data.ApplicationName,
        });
    }

    if (data.QueryStartAt) {
        items.push({
            label: i18n('query-details.query-start-at'),
            value: formatDateTime(new Date(data.QueryStartAt as string).getTime()),
        });
    }

    return items;
}

export function useRunningQueriesSort() {
    const [tableSort, handleTableSort] = useTableSort({
        initialSortColumn: QUERIES_COLUMNS_IDS.QueryStartAt,
        initialSortOrder: DataTable.DESCENDING,
        multiple: true,
    });

    return {
        tableSort,
        handleTableSort,
        backendSort: React.useMemo(
            () =>
                prepareBackendSortFieldsFromTableSort(tableSort, getRunningQueriesColumnSortField),
            [tableSort],
        ),
    };
}
