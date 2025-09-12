import {Flex} from '@gravity-ui/uikit';

import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {cn} from '../../../../../utils/cn';
import {ENABLE_NETWORK_TABLE_KEY} from '../../../../../utils/constants';
import {useSearchQuery, useSetting} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import i18n from '../i18n';

import {TopNodesByPing} from './TopNodesByPing';
import {TopNodesBySkew} from './TopNodesBySkew';

import './TenantNetwork.scss';

const b = cn('tenant-network');

interface TenantNetworkProps {
    database: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantNetwork({database, additionalNodesProps}: TenantNetworkProps) {
    const query = useSearchQuery();
    const [networkTableEnabled] = useSetting(ENABLE_NETWORK_TABLE_KEY);

    const tab = networkTableEnabled
        ? {[TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.network}
        : {[TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes};

    const allNodesLink = getTenantPath({
        ...query,
        ...tab,
    });

    return (
        <Flex direction="column" gap={4} className={b()}>
            <StatsWrapper title={i18n('title_nodes-by-ping')} allEntitiesLink={allNodesLink}>
                <TopNodesByPing database={database} additionalNodesProps={additionalNodesProps} />
            </StatsWrapper>
            <StatsWrapper title={i18n('title_nodes-by-skew')} allEntitiesLink={allNodesLink}>
                <TopNodesBySkew database={database} additionalNodesProps={additionalNodesProps} />
            </StatsWrapper>
        </Flex>
    );
}
