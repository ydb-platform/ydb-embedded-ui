import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../components/Drawer';
import {EnableFullscreenButton} from '../../components/EnableFullscreenButton/EnableFullscreenButton';
import {
    selectAllClusterHealthcheckInfo,
    selectClusterCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {SelfCheckResult} from '../../types/api/healthcheck';
import {createAndDownloadJsonFile} from '../../utils/downloadFile';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../Tenant/constants';
import tenantI18n from '../Tenant/i18n';
import {useTenantQueryParams} from '../Tenant/useTenantQueryParams';

interface ClusterDrawerHealthcheckProps {
    clusterName?: string;
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function ClusterDrawerHealthcheck({
    clusterName,
    isVisible,
    onClose,
    children,
}: ClusterDrawerHealthcheckProps) {
    const {handleIssuesFilterChange, handleHealthcheckViewChange} = useTenantQueryParams();

    const healthcheckStatus = useTypedSelector((state) =>
        selectClusterCheckStatus(state, clusterName || ''),
    );

    const healthcheckData = useTypedSelector((state) =>
        selectAllClusterHealthcheckInfo(state, clusterName || ''),
    );

    const handleCloseDrawer = React.useCallback(() => {
        onClose();
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [onClose, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        if (!clusterName) {
            return null;
        }
        return <Healthcheck clusterName={clusterName} />;
    }, [clusterName]);

    return (
        <DrawerWrapper
            isDrawerVisible={isVisible && Boolean(clusterName)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="cluster-healthcheck-details"
            storageKey="cluster-healthcheck-details-drawer-width"
            detectClickOutside
            hideVeil={false}
            isPercentageWidth
            drawerControls={[
                {
                    type: 'custom',
                    key: 'download',
                    node: (
                        <ActionTooltip title={tenantI18n('label_download')}>
                            <Button
                                view="flat"
                                disabled={!healthcheckData}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    createAndDownloadJsonFile(
                                        healthcheckData,
                                        `${clusterName}-cluster-healthcheck-${new Date().getTime()}`,
                                    );
                                }}
                            >
                                <Icon data={ArrowDownToLine} />
                            </Button>
                        </ActionTooltip>
                    ),
                },
                {
                    type: 'custom',
                    node: <EnableFullscreenButton view="flat" />,
                    key: 'fullscreen',
                },
                {type: 'close'},
            ]}
            title={<DrawerTitle clusterName={clusterName} status={healthcheckStatus} />}
        >
            {children}
        </DrawerWrapper>
    );
}

interface DrawerTitleProps {
    clusterName?: string;
    status?: SelfCheckResult;
}

function DrawerTitle({clusterName, status}: DrawerTitleProps) {
    return (
        <Flex direction="column">
            <Text variant="subheader-2">
                {tenantI18n('label_healthcheck-dashboard')}
                {clusterName ? `: ${clusterName}` : ''}
            </Text>
            <Text color="secondary">{status && HEALTHCHECK_RESULT_TO_TEXT[status]}</Text>
        </Flex>
    );
}
