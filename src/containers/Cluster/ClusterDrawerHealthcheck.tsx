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
    clusterName?: string;
}

export function useClusterHealthcheckQueryParams() {
    const [
        {showHealthcheck, issuesFilter, view, healthcheckIssue, healthcheckLeaf},
        setQueryParams,
    ] = useQueryParams({
        showHealthcheck: BooleanParam,
        issuesFilter: StringParam,
        view: StringParam,
        healthcheckIssue: StringParam,
        healthcheckLeaf: StringParam,
    });

    const handleShowHealthcheckChange = React.useCallback(
        (value?: boolean) => {
            setQueryParams({showHealthcheck: value || undefined}, 'replaceIn');
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

    const handleOpenHealthcheckIssue = React.useCallback(
        (target: {issueId: string; leafIssueId: string; view: string}) => {
            setQueryParams(
                {
                    showHealthcheck: true,
                    issuesFilter: undefined,
                    view: target.view,
                    healthcheckIssue: target.issueId,
                    healthcheckLeaf: target.leafIssueId,
                },
                'replaceIn',
            );
        },
        [setQueryParams],
    );

    const handleCloseHealthcheck = React.useCallback(() => {
        setQueryParams(
            {
                showHealthcheck: undefined,
                issuesFilter: undefined,
                view: undefined,
                healthcheckIssue: undefined,
                healthcheckLeaf: undefined,
            },
            'replaceIn',
        );
    }, [setQueryParams]);

    return {
        showHealthcheck,
        handleShowHealthcheckChange,
        issuesFilter,
        handleIssuesFilterChange,
        view,
        handleHealthcheckViewChange,
        healthcheckIssue,
        healthcheckLeaf,
        handleOpenHealthcheckIssue,
        handleCloseHealthcheck,
    };
}

export function ClusterDrawerHealthcheck({
    children,
    database,
    clusterName,
}: ClusterDrawerHealthcheckProps) {
    const {showHealthcheck, healthcheckIssue, healthcheckLeaf, handleCloseHealthcheck} =
        useClusterHealthcheckQueryParams();

    const healthcheckStatus = useTypedSelector((state) =>
        selectCheckStatus(state, database, clusterName),
    );

    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database, clusterName),
    );
    const targetLeafIssueRef = React.useRef<HTMLDivElement | null>(null);
    const drawerTransitionCompleteRef = React.useRef(false);
    const scrolledTargetRef = React.useRef<{
        issueId?: string;
        leafIssueId?: string;
    }>({});

    const scrollToTargetIssue = React.useCallback(() => {
        if (!drawerTransitionCompleteRef.current || !healthcheckIssue || !healthcheckLeaf) {
            return;
        }

        if (
            scrolledTargetRef.current.issueId === healthcheckIssue &&
            scrolledTargetRef.current.leafIssueId === healthcheckLeaf
        ) {
            return;
        }

        const targetIssue = targetLeafIssueRef.current;
        const scrollContainer = targetIssue?.closest<HTMLElement>('.ydb-fullscreen__content');
        if (!targetIssue || !scrollContainer) {
            return;
        }

        const controls = scrollContainer.querySelector<HTMLElement>('.ydb-healthcheck__controls');
        const targetTop =
            scrollContainer.scrollTop +
            targetIssue.getBoundingClientRect().top -
            scrollContainer.getBoundingClientRect().top -
            (controls?.getBoundingClientRect().height ?? 0);

        scrolledTargetRef.current = {
            issueId: healthcheckIssue,
            leafIssueId: healthcheckLeaf,
        };
        scrollContainer.scrollTo({top: Math.max(0, targetTop), behavior: 'smooth'});
    }, [healthcheckIssue, healthcheckLeaf]);

    const handleTargetLeafIssueRef = React.useCallback(
        (element: HTMLDivElement | null) => {
            targetLeafIssueRef.current = element;
            if (element) {
                window.requestAnimationFrame(scrollToTargetIssue);
            }
        },
        [scrollToTargetIssue],
    );

    const handleTransitionInComplete = React.useCallback(() => {
        drawerTransitionCompleteRef.current = true;
        scrollToTargetIssue();
    }, [scrollToTargetIssue]);

    const handleCloseDrawer = React.useCallback(() => {
        drawerTransitionCompleteRef.current = false;
        scrolledTargetRef.current = {};
        handleCloseHealthcheck();
    }, [handleCloseHealthcheck]);

    const renderDrawerContent = React.useCallback(() => {
        return (
            <Healthcheck
                database={database}
                clusterName={clusterName}
                targetIssueId={healthcheckIssue ?? undefined}
                targetLeafIssueId={healthcheckLeaf ?? undefined}
                targetLeafIssueRef={handleTargetLeafIssueRef}
            />
        );
    }, [clusterName, database, handleTargetLeafIssueRef, healthcheckIssue, healthcheckLeaf]);

    return (
        <DrawerWrapper
            isDrawerVisible={Boolean(showHealthcheck) && Boolean(database)}
            onCloseDrawer={handleCloseDrawer}
            onTransitionInComplete={
                healthcheckIssue && healthcheckLeaf ? handleTransitionInComplete : undefined
            }
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
