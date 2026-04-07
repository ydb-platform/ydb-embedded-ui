import type {Settings} from '@gravity-ui/react-data-table';

import type {YDBDefinitionListItem} from '../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {KeyValueRow} from '../../../../types/api/query';
import {formatDateTime, formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {generateHash} from '../../../../utils/generateHash';
import {isNonEmptyValue, valueIsDefined} from '../../../../utils/index';
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

    if (valueIsDefined(data.QueryText)) {
        items.push({
            name: columnsI18n('query-hash'),
            content: generateHash(String(data.QueryText)),
        });
    }

    if (valueIsDefined(data.CPUTimeUs)) {
        items.push({
            name: columnsI18n('cpu-time'),
            content: formatToMs(parseUsToMs(data.CPUTimeUs)),
        });
    }

    if (valueIsDefined(data.Duration)) {
        items.push({
            name: columnsI18n('duration'),
            content: formatToMs(parseUsToMs(data.Duration)),
        });
    }

    if (valueIsDefined(data.ReadBytes)) {
        items.push({
            name: columnsI18n('read-bytes'),
            content: formatNumber(data.ReadBytes),
        });
    }

    if (valueIsDefined(data.RequestUnits)) {
        items.push({
            name: columnsI18n('request-units'),
            content: formatNumber(data.RequestUnits),
        });
    }

    if (valueIsDefined(data.EndTime)) {
        items.push({
            name: columnsI18n('end-time'),
            content: formatDateTime(new Date(data.EndTime as string).getTime()),
        });
    }

    if (valueIsDefined(data.ReadRows)) {
        items.push({
            name: columnsI18n('read-rows'),
            content: formatNumber(data.ReadRows),
        });
    }

    if (isNonEmptyValue(data.UserSID)) {
        items.push({
            name: columnsI18n('user'),
            content: data.UserSID,
        });
    }

    if (isNonEmptyValue(data.ApplicationName)) {
        items.push({
            name: columnsI18n('application'),
            content: data.ApplicationName,
        });
    }

    if (valueIsDefined(data.QueryStartAt)) {
        items.push({
            name: columnsI18n('start-time'),
            content: formatDateTime(new Date(data.QueryStartAt as string).getTime()),
        });
    }

    if (isNonEmptyValue(data.WmPoolId)) {
        items.push({
            name: columnsI18n('wm-pool-id'),
            content: data.WmPoolId,
        });
    }

    if (isNonEmptyValue(data.WmState)) {
        items.push({
            name: columnsI18n('wm-state'),
            content: data.WmState,
        });
    }

    if (isNonEmptyValue(data.WmEnterTime)) {
        items.push({
            name: columnsI18n('wm-enter-time'),
            content: formatDateTime(new Date(data.WmEnterTime as string).getTime()),
        });
    }

    if (isNonEmptyValue(data.WmExitTime)) {
        items.push({
            name: columnsI18n('wm-exit-time'),
            content: formatDateTime(new Date(data.WmExitTime as string).getTime()),
        });
    }

    if (isNonEmptyValue(data.ClientAddress)) {
        items.push({
            name: columnsI18n('client-address'),
            content: data.ClientAddress,
        });
    }

    if (valueIsDefined(data.ClientPID)) {
        items.push({
            name: columnsI18n('client-pid'),
            content: data.ClientPID,
        });
    }

    if (isNonEmptyValue(data.ClientUserAgent)) {
        items.push({
            name: columnsI18n('client-user-agent'),
            content: data.ClientUserAgent,
        });
    }

    if (isNonEmptyValue(data.ClientSdkBuildInfo)) {
        items.push({
            name: columnsI18n('client-sdk-build-info'),
            content: data.ClientSdkBuildInfo,
        });
    }

    return items;
}
