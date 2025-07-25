import {Flex, Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {TENANT_NETWORK_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import {TopNodesByPing} from './TopNodesByPing';
import {TopNodesBySkew} from './TopNodesBySkew';
import {useTenantNetworkQueryParams} from './useTenantNetworkQueryParams';

import './TenantNetwork.scss';

const b = cn('tenant-network');

const networkTabs = [
    {id: TENANT_NETWORK_TABS_IDS.ping, title: i18n('title_nodes-by-ping')},
    {id: TENANT_NETWORK_TABS_IDS.skew, title: i18n('title_nodes-by-skew')},
];

interface TenantNetworkProps {
    tenantName: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantNetwork({tenantName, additionalNodesProps}: TenantNetworkProps) {
    const {networkTab, handleNetworkTabChange} = useTenantNetworkQueryParams();

    const renderTabContent = () => {
        switch (networkTab) {
            case TENANT_NETWORK_TABS_IDS.ping: {
                return (
                    <TopNodesByPing
                        tenantName={tenantName}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
            case TENANT_NETWORK_TABS_IDS.skew: {
                return (
                    <TopNodesBySkew
                        tenantName={tenantName}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
            default: {
                return null;
            }
        }
    };

    return (
        <Flex direction="column" gap={4} className={b()}>
            <Flex direction="column" gap={3} className={b('tabs-container')}>
                <TabProvider value={networkTab}>
                    <TabList size="m">
                        {networkTabs.map(({id, title}) => {
                            return (
                                <Tab key={id} value={id} onClick={() => handleNetworkTabChange(id)}>
                                    {title}
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>

                <Flex direction="column" className={b('tab-content')}>
                    {renderTabContent()}
                </Flex>
            </Flex>
        </Flex>
    );
}
