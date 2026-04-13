import {PlugConnection} from '@gravity-ui/icons';
import {ActionTooltip, Button, ClipboardButton, Flex, Icon} from '@gravity-ui/uikit';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {ServerlessDBLabel} from '../../components/ServerlessDBLabel/ServerlessDBLabel';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {HealthcheckPreview} from '../Tenant/Diagnostics/TenantOverview/Healthcheck/HealthcheckPreview';

import {b} from './constants';
import {headerKeyset} from './i18n';

interface HeaderLeftControlsProps {
    database: string;
    databaseData?: PreparedTenant;
    isDatabaseDataLoading: boolean;
}

export function HeaderLeftControls({
    database,
    databaseData,
    isDatabaseDataLoading,
}: HeaderLeftControlsProps) {
    const showCopyButton = Boolean(databaseData?.Name);
    const isServerless = databaseData?.Type === 'Serverless';
    const showHealthcheck = !isServerless && !isDatabaseDataLoading;

    return (
        <Flex direction="row" alignItems={'center'} gap={2} className={b('left-controls')}>
            <Flex direction="row" alignItems={'center'}>
                {showCopyButton && databaseData?.Name ? (
                    <ClipboardButton
                        view="flat-secondary"
                        text={databaseData.Name}
                        color="secondary"
                        size="s"
                    />
                ) : null}
                <ActionTooltip title={headerKeyset('description_connect-to-db')}>
                    <Button
                        view="flat-secondary"
                        size="s"
                        onClick={() => getConnectToDBDialog({database})}
                    >
                        <Icon data={PlugConnection} />
                    </Button>
                </ActionTooltip>
            </Flex>
            <Flex direction="row" alignItems={'center'} gap={2}>
                {isServerless ? <ServerlessDBLabel /> : null}
                {showHealthcheck ? <HealthcheckPreview database={database} compact /> : null}
            </Flex>
        </Flex>
    );
}
