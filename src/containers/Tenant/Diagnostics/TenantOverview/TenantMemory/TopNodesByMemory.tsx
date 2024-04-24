import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {topNodesApi} from '../../../../../store/reducers/tenantOverview/topNodes/topNodes';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {DEFAULT_POLLING_INTERVAL} from '../../../../../utils/constants';
import {useSearchQuery, useTypedSelector} from '../../../../../utils/hooks';
import {getTopNodesByMemoryColumns} from '../../../../Nodes/getNodesColumns';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import {getSectionTitle} from '../getSectionTitle';
import i18n from '../i18n';

interface TopNodesByMemoryProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TopNodesByMemory({path, additionalNodesProps}: TopNodesByMemoryProps) {
    const query = useSearchQuery();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const columns = getTopNodesByMemoryColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
    });

    const {currentData, isFetching, error} = topNodesApi.useGetTopNodesQuery(
        {tenant: path, sortValue: 'Memory'},
        {pollingInterval: autorefresh ? DEFAULT_POLLING_INTERVAL : 0},
    );

    const loading = isFetching && currentData === undefined;
    const topNodes = currentData;

    const title = getSectionTitle({
        entity: i18n('nodes'),
        postfix: i18n('by-memory'),
        link: getTenantPath({
            ...query,
            [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
        }),
    });

    return (
        <TenantOverviewTableLayout
            data={topNodes || []}
            columns={columns}
            title={title}
            loading={loading}
            error={error}
            emptyDataMessage={i18n('top-nodes.empty-data')}
        />
    );
}
