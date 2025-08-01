import {Flex} from '@gravity-ui/uikit';

import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {cn} from '../../../../../utils/cn';
import {useSearchQuery} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import i18n from '../i18n';

import {TopNodesByPing} from './TopNodesByPing';
import {TopNodesBySkew} from './TopNodesBySkew';

import './TenantNetwork.scss';

const b = cn('tenant-network');

interface TenantNetworkProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantNetwork({tenantName, additionalNodesProps}: TenantNetworkProps) {
    const query = useSearchQuery();
    return (
        <Flex direction="column" gap={4} className={b()}>
            <StatsWrapper
                title={i18n('title_nodes-by-ping')}
                allEntitiesLink={getTenantPath({
                    ...query,
                    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
                })}
            >
                <TopNodesByPing
                    tenantName={tenantName}
                    additionalNodesProps={additionalNodesProps}
                />
            </StatsWrapper>
            <StatsWrapper
                title={i18n('title_nodes-by-skew')}
                allEntitiesLink={getTenantPath({
                    ...query,
                    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
                })}
            >
                <TopNodesBySkew
                    tenantName={tenantName}
                    additionalNodesProps={additionalNodesProps}
                />
            </StatsWrapper>
        </Flex>
    );
}
