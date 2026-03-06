import type {Settings} from '@gravity-ui/react-data-table';

import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {KeyValueRow} from '../../../../types/api/query';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../utils/generateHash';
import {formatToMs, parseUsToMs} from '../../../../utils/timeParsers';
import {QUERY_TABLE_SETTINGS} from '../../utils/constants';

import columnsI18n from './columns/i18n';

export const TOP_QUERIES_TABLE_SETTINGS: Settings = {
    ...QUERY_TABLE_SETTINGS,
    disableSortReset: true,
    externalSort: true,
    dynamicRenderType: 'uniform', // All rows have fixed height due to FixedHeightQuery
};

export function createQueryInfoItems(data: KeyValueRow): YDBDefinitionListItem[] {
    const items: YDBDefinitionListItem[] = [];

    if (data.QueryText) {
        items.push({
            name: columnsI18n('query-hash'),
            content: generateHash(String(data.QueryText)),
        });
    }

    if (data.CPUTimeUs !== undefined) {
        items.push({
            name: columnsI18n('cpu-time'),
            content: formatToMs(parseUsToMs(data.CPUTimeUs ?? undefined)),
        });
    }

    if (data.Duration !== undefined) {
        items.push({
            name: columnsI18n('duration'),
            content: formatToMs(parseUsToMs(data.Duration ?? undefined)),
        });
    }

    if (data.ReadBytes !== undefined) {
        items.push({
            name: columnsI18n('read-bytes'),
            content: formatNumber(data.ReadBytes),
        });
    }

    if (data.RequestUnits !== undefined) {
        items.push({
            name: columnsI18n('request-units'),
            content: formatNumber(data.RequestUnits),
        });
    }

    if (data.EndTime) {
        items.push({
            name: columnsI18n('end-time'),
            content: formatDateTime(new Date(data.EndTime as string).getTime()),
        });
    }

    if (data.ReadRows !== undefined) {
        items.push({
            name: columnsI18n('read-rows'),
            content: formatNumber(data.ReadRows),
        });
    }

    if (data.UserSID) {
        items.push({
            name: columnsI18n('user'),
            content: data.UserSID,
        });
    }

    if (data.ApplicationName) {
        items.push({
            name: columnsI18n('application'),
            content: data.ApplicationName,
        });
    }

    if (data.QueryStartAt) {
        items.push({
            name: columnsI18n('start-time'),
            content: formatDateTime(new Date(data.QueryStartAt as string).getTime()),
        });
    }

    return items;
}
