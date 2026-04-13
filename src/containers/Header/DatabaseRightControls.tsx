import React from 'react';

import {ChartAreaStacked, PlugConnection} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {MONITORING_UI_TITLE} from '../../utils/constants';

import {DeveloperUIControl} from './GlobalRightControls';
import {DBHeaderActionsMenu} from './HeaderActionsMenu';
import {headerKeyset} from './i18n';

interface DatabaseRightControlsProps {
    database: string;
    clusterName?: string;
    databaseData?: PreparedTenant;
    isDatabaseDataLoading: boolean;
    isV2NavigationEnabled: boolean;
    monitoringLinkUrl: string | null;
    showDeveloperUI: boolean;
}

export function DatabaseRightControls({
    database,
    clusterName,
    databaseData,
    isDatabaseDataLoading,
    isV2NavigationEnabled,
    monitoringLinkUrl,
    showDeveloperUI,
}: DatabaseRightControlsProps) {
    const showMonitoring = Boolean(monitoringLinkUrl);
    const showLegacyConnect = !isV2NavigationEnabled;
    return (
        <React.Fragment>
            {showMonitoring && monitoringLinkUrl ? (
                <ActionTooltip title={headerKeyset('description_monitoring')}>
                    <Button view="flat" href={monitoringLinkUrl} target="_blank">
                        <Icon data={ChartAreaStacked} />
                        {MONITORING_UI_TITLE}
                    </Button>
                </ActionTooltip>
            ) : null}

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
            />
        </React.Fragment>
    );
}
