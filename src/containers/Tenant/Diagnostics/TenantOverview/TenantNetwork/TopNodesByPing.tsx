import React from 'react';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../../../../components/nodesColumns/constants';
import {nodesApi} from '../../../../../store/reducers/nodes/nodes';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSearchQuery} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

import {getTopNodesByPingColumns} from './columns';

const TENANT_OVERVIEW_TABLES_SETTINGS = {
    stripedRows: false,
    sortable: false,
};

interface TopNodesByPingProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByPing({tenantName, additionalNodesProps}: TopNodesByPingProps) {
    const query = useSearchQuery();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [columns, fieldsRequired] = getTopNodesByPingColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database: tenantName,
    });

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            tenant: tenantName,
            type: 'any',
            sort: '-PingTime',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            tablets: false,
            fieldsRequired: fieldsRequired as any,
        },
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const topNodes = currentData?.Nodes || [];

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-ping'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
        }),
    });

    return (
        <TenantOverviewTableLayout
            title={title}
            loading={loading}
            error={error}
            withData={Boolean(currentData)}
        >
            <ResizeableDataTable
                columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
                data={topNodes}
                columns={columns}
                emptyDataMessage={i18n('top-nodes.empty-data')}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
