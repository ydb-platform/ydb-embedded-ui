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

    if (data.QueryText !== null && data.QueryText !== undefined) {
        items.push({
            name: columnsI18n('query-hash'),
            content: generateHash(String(data.QueryText)),
        });
    }

    if (data.CPUTimeUs !== null && data.CPUTimeUs !== undefined) {
        items.push({
            name: columnsI18n('cpu-time'),
            content: formatToMs(parseUsToMs(data.CPUTimeUs)),
        });
    }

    if (data.Duration !== null && data.Duration !== undefined) {
        items.push({
            name: columnsI18n('duration'),
            content: formatToMs(parseUsToMs(data.Duration)),
        });
    }

    if (data.ReadBytes !== null && data.ReadBytes !== undefined) {
        items.push({
            name: columnsI18n('read-bytes'),
            content: formatNumber(data.ReadBytes),
        });
    }

    if (data.RequestUnits !== null && data.RequestUnits !== undefined) {
        items.push({
            name: columnsI18n('request-units'),
            content: formatNumber(data.RequestUnits),
        });
    }

    if (data.EndTime !== null && data.EndTime !== undefined) {
        items.push({
            name: columnsI18n('end-time'),
            content: formatDateTime(new Date(data.EndTime as string).getTime()),
        });
    }

    if (data.ReadRows !== null && data.ReadRows !== undefined) {
        items.push({
            name: columnsI18n('read-rows'),
            content: formatNumber(data.ReadRows),
        });
    }

    if (data.UserSID !== null && data.UserSID !== undefined && data.UserSID !== '') {
        items.push({
            name: columnsI18n('user'),
            content: data.UserSID,
        });
    }

    if (
        data.ApplicationName !== null &&
        data.ApplicationName !== undefined &&
        data.ApplicationName !== ''
    ) {
        items.push({
            name: columnsI18n('application'),
            content: data.ApplicationName,
        });
    }

    if (data.QueryStartAt !== null && data.QueryStartAt !== undefined) {
        items.push({
            name: columnsI18n('start-time'),
            content: formatDateTime(new Date(data.QueryStartAt as string).getTime()),
        });
    }

    if (data.WmPoolId !== null && data.WmPoolId !== undefined && data.WmPoolId !== '') {
        items.push({
            name: columnsI18n('wm-pool-id'),
            content: data.WmPoolId,
        });
    }

    if (data.WmState !== null && data.WmState !== undefined && data.WmState !== '') {
        items.push({
            name: columnsI18n('wm-state'),
            content: data.WmState,
        });
    }

    if (data.WmEnterTime !== null && data.WmEnterTime !== undefined && data.WmEnterTime !== '') {
        items.push({
            name: columnsI18n('wm-enter-time'),
            content: formatDateTime(new Date(data.WmEnterTime as string).getTime()),
        });
    }

    if (data.WmExitTime !== null && data.WmExitTime !== undefined && data.WmExitTime !== '') {
        items.push({
            name: columnsI18n('wm-exit-time'),
            content: formatDateTime(new Date(data.WmExitTime as string).getTime()),
        });
    }

    if (
        data.ClientAddress !== null &&
        data.ClientAddress !== undefined &&
        data.ClientAddress !== ''
    ) {
        items.push({
            name: columnsI18n('client-address'),
            content: data.ClientAddress,
        });
    }

    if (data.ClientPID !== null && data.ClientPID !== undefined) {
        items.push({
            name: columnsI18n('client-pid'),
            content: data.ClientPID,
        });
    }

    if (
        data.ClientUserAgent !== null &&
        data.ClientUserAgent !== undefined &&
        data.ClientUserAgent !== ''
    ) {
        items.push({
            name: columnsI18n('client-user-agent'),
            content: data.ClientUserAgent,
        });
    }

    if (
        data.ClientSdkBuildInfo !== null &&
        data.ClientSdkBuildInfo !== undefined &&
        data.ClientSdkBuildInfo !== ''
    ) {
        items.push({
            name: columnsI18n('client-sdk-build-info'),
            content: data.ClientSdkBuildInfo,
        });
    }

    return items;
}
