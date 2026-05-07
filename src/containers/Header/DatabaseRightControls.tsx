import React from 'react';

import {PlugConnection} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {ClusterLinkWithTitle} from '../../types/additionalProps';
import {CLUSTER_LINK_CONTEXT} from '../../utils/clusterLinks/clusterLinkConstants';

import {DeveloperUIControl} from './GlobalRightControls';
import {DBHeaderActionsMenu} from './HeaderActionsMenu';
import {MonitoringControl} from './MonitoringControl';
import {headerKeyset} from './i18n';

interface DatabaseRightControlsProps {
    database: string;
    clusterName?: string;
    databaseData?: PreparedTenant;
    isDatabaseDataLoading: boolean;
    isV2NavigationEnabled: boolean;
    showDeveloperUI: boolean;
    databaseLinks: ClusterLinkWithTitle[];
}

export function DatabaseRightControls({
    database,
    clusterName,
    databaseData,
    isDatabaseDataLoading,
    isV2NavigationEnabled,
    showDeveloperUI,
    databaseLinks,
}: DatabaseRightControlsProps) {
    const monitoringDatabaseLink = React.useMemo(
        () => databaseLinks.find((link) => link.context === CLUSTER_LINK_CONTEXT.MONITORING),
        [databaseLinks],
    );

    const actionDatabaseLinks = React.useMemo(
        () => databaseLinks.filter((link) => link.context !== CLUSTER_LINK_CONTEXT.MONITORING),
        [databaseLinks],
    );

    const showLegacyConnect = !isV2NavigationEnabled;
    return (
        <React.Fragment>
            {monitoringDatabaseLink ? <MonitoringControl link={monitoringDatabaseLink} /> : null}

            {showLegacyConnect ? (
                <ActionTooltip title={headerKeyset('description_connect-to-db')}>
                    <Button view="flat" onClick={() => getConnectToDBDialog({database})}>
                        <Icon data={PlugConnection} />
                        {headerKeyset('title_connect')}
                    </Button>
                </ActionTooltip>
            ) : null}
            {showDeveloperUI ? <DeveloperUIControl /> : null}
            <DBHeaderActionsMenu
                database={database}
                clusterName={clusterName}
                databaseData={databaseData}
                isDatabaseDataLoading={isDatabaseDataLoading}
                isV2NavigationEnabled={isV2NavigationEnabled}
                databaseLinks={actionDatabaseLinks}
            />
        </React.Fragment>
    );
}
