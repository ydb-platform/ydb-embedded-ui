import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../components/Drawer';
import {EnableFullscreenButton} from '../../components/EnableFullscreenButton/EnableFullscreenButton';
import {
    selectAllHealthcheckInfo,
    selectCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {SelfCheckResult} from '../../types/api/healthcheck';
import {createAndDownloadJsonFile} from '../../utils/downloadFile';
import {useTypedSelector} from '../../utils/hooks';

import {Healthcheck} from './Healthcheck/Healthcheck';
import {useCurrentSchema} from './TenantContext';
import {HEALTHCHECK_RESULT_TO_TEXT} from './constants';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerHealthcheck({children}: TenantDrawerWrapperProps) {
    const {database} = useCurrentSchema();
    const {
        handleShowHealthcheckChange,
        showHealthcheck,
        handleIssuesFilterChange,
        handleHealthcheckViewChange,
    } = useTenantQueryParams();

    const healthcheckStatus = useTypedSelector((state) => selectCheckStatus(state, database || ''));

    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database || ''),
    );

    const handleCloseDrawer = React.useCallback(() => {
        handleShowHealthcheckChange(false);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleShowHealthcheckChange, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <Healthcheck database={database} />;
    }, [database]);

    return (
        <DrawerWrapper
            isDrawerVisible={Boolean(showHealthcheck)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="tenant-healthcheck-details"
            storageKey="tenant-healthcheck-details-drawer-width"
            detectClickOutside
            hideVeil={false}
            isPercentageWidth
            drawerControls={[
                {
                    type: 'custom',
                    key: 'download',
                    node: (
                        <ActionTooltip title={i18n('label_download')}>
                            <Button
                                view="flat"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    createAndDownloadJsonFile(
                                        healthcheckData,
                                        `${database}-healthcheck-${new Date().getTime()}`,
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
            title={<DrawerTitle status={healthcheckStatus} />}
        >
            {children}
        </DrawerWrapper>
    );
}

interface DrawerTitleProps {
    status?: SelfCheckResult;
}

function DrawerTitle({status}: DrawerTitleProps) {
    return (
        <Flex direction="column">
            <Text variant="subheader-2">{i18n('label_healthcheck-dashboard')}</Text>
            <Text color="secondary">{status && HEALTHCHECK_RESULT_TO_TEXT[status]}</Text>
        </Flex>
    );
}
