import {Flex} from '@gravity-ui/uikit';

import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {cn} from '../../../../../utils/cn';
import {useSetting} from '../../../../../utils/hooks';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopNodesByPing} from './TopNodesByPing';
import {TopNodesBySkew} from './TopNodesBySkew';
import {networkDashboardConfig} from './networkDashboardConfig';

import './TenantNetwork.scss';

const b = cn('tenant-network');

interface TenantNetworkProps {
    database: string;
}

export function TenantNetwork({database}: TenantNetworkProps) {
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const [networkTableEnabled] = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    const allNodesLink = getDiagnosticsPageLink(
        networkTableEnabled
            ? TENANT_DIAGNOSTICS_TABS_IDS.network
            : TENANT_DIAGNOSTICS_TABS_IDS.nodes,
    );

    return (
        <Flex direction="column" gap={4} className={b()}>
            <TenantDashboard database={database} charts={networkDashboardConfig} />
            <StatsWrapper title={i18n('title_nodes-by-ping')} allEntitiesLink={allNodesLink}>
                <TopNodesByPing database={database} />
            </StatsWrapper>
            <StatsWrapper title={i18n('title_nodes-by-skew')} allEntitiesLink={allNodesLink}>
                <TopNodesBySkew database={database} />
            </StatsWrapper>
        </Flex>
    );
}
