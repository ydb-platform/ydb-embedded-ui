import React from 'react';

import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

import {
    selectAllHealthcheckInfo,
    selectCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HealthcheckDrawer} from '../Tenant/Healthcheck/components/HealthcheckDrawer';

import i18n from './i18n';

interface ClusterDrawerHealthcheckProps {
    children: React.ReactNode;
    database: string;
}

export function useClusterHealthcheckQueryParams() {
    const [{showHealthcheck, issuesFilter, view}, setQueryParams] = useQueryParams({
        showHealthcheck: BooleanParam,
        issuesFilter: StringParam,
        view: StringParam,
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
        handleShowHealthcheckChange(false);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleShowHealthcheckChange, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <Healthcheck database={database} />;
    }, [database]);

    return (
        <HealthcheckDrawer
            isDrawerVisible={Boolean(showHealthcheck) && Boolean(database)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="cluster-healthcheck-details"
            storageKey="cluster-healthcheck-details-drawer-width"
            title={i18n('title_healthcheck-dashboard')}
            status={healthcheckStatus}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${database}-healthcheck`}
            downloadTooltip={i18n('action_download-healthcheck')}
            isDownloadDisabled={!healthcheckData}
        >
            {children}
        </HealthcheckDrawer>
    );
}
