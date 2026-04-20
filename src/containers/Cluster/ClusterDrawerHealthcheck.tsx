import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon, Text} from '@gravity-ui/uikit';
import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

import {DrawerWrapper} from '../../components/Drawer';
import {EnableFullscreenButton} from '../../components/EnableFullscreenButton/EnableFullscreenButton';
import {
    selectAllHealthcheckInfo,
    selectCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {SelfCheckResult} from '../../types/api/healthcheck';
import {createAndDownloadJsonFile} from '../../utils/downloadFile';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HEALTHCHECK_RESULT_TO_TEXT} from '../Tenant/constants';

import i18n from './i18n';

interface ClusterDrawerHealthcheckProps {
    children: React.ReactNode;
    database: string;
}

export function useClusterHealthcheckQueryParams() {
    const [{showHealthcheck, issuesFilter, view}, setQueryParams] = useQueryParams({
        showHealthcheck: BooleanParam,
        database: StringParam,
        issuesFilter: StringParam,
        view: StringParam,
    });

    const handleShowHealthcheckChange = React.useCallback(
        (value?: boolean, database?: string) => {
            setQueryParams(
                {
                    showHealthcheck: value || undefined,
                    database: value ? database : undefined,
                },
                'replaceIn',
            );
        },
        [setQueryParams],
    );

    const handleIssuesFilterChange = React.useCallback(
        (value?: string) => {
            setQueryParams({issuesFilter: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleHealthcheckViewChange = React.useCallback(
        (value?: string) => {
            setQueryParams({view: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        showHealthcheck,
        handleShowHealthcheckChange,
        issuesFilter,
        handleIssuesFilterChange,
        view,
        handleHealthcheckViewChange,
    };
}

export function ClusterDrawerHealthcheck({children, database}: ClusterDrawerHealthcheckProps) {
    const {
        handleShowHealthcheckChange,
        showHealthcheck,
        handleIssuesFilterChange,
        handleHealthcheckViewChange,
    } = useClusterHealthcheckQueryParams();

    const healthcheckStatus = useTypedSelector((state) => selectCheckStatus(state, database));

    const healthcheckData = useTypedSelector((state) => selectAllHealthcheckInfo(state, database));

    const handleCloseDrawer = React.useCallback(() => {
        handleShowHealthcheckChange(false, undefined);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleShowHealthcheckChange, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <Healthcheck database={database} />;
    }, [database]);

    return (
        <DrawerWrapper
            isDrawerVisible={Boolean(showHealthcheck) && Boolean(database)}
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
                        <ActionTooltip title={i18n('action_download-healthcheck')}>
                            <Button
                                view="flat"
                                disabled={!healthcheckData}
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
            <Text variant="subheader-2">{i18n('title_healthcheck-dashboard')}</Text>
            <Text color="secondary">{status && HEALTHCHECK_RESULT_TO_TEXT[status]}</Text>
        </Flex>
    );
}
