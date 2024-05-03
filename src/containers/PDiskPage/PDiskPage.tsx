import React from 'react';

import {Icon} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {DiskPageTitle} from '../../components/DiskPageTitle/DiskPageTitle';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {PDiskInfo} from '../../components/PDiskInfo/PDiskInfo';
import {PageMeta} from '../../components/PageMeta/PageMeta';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {pDiskApi} from '../../store/reducers/pdisk/pdisk';
import {valueIsDefined} from '../../utils';
import {DEFAULT_POLLING_INTERVAL} from '../../utils/constants';
import {getSeverityColor} from '../../utils/disks/helpers';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {PDiskGroups} from './PDiskGroups';
import {pDiskPageKeyset} from './i18n';
import {pdiskPageCn} from './shared';

import ArrowRotateLeftIcon from '@gravity-ui/icons/svgs/arrow-rotate-left.svg';

import './PDiskPage.scss';

export function PDiskPage() {
    const dispatch = useTypedDispatch();

    const nodesMap = useTypedSelector(selectNodesMap);

    const [{nodeId, pDiskId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
    });

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('pDisk', {nodeId, pDiskId}));
    }, [dispatch, nodeId, pDiskId]);

    const params =
        valueIsDefined(nodeId) && valueIsDefined(pDiskId) ? {nodeId, pDiskId} : skipToken;
    const pdiskDataQuery = pDiskApi.useGetPdiskInfoQuery(params, {
        pollingInterval: DEFAULT_POLLING_INTERVAL,
    });
    const pDiskLoading = pdiskDataQuery.isFetching && pdiskDataQuery.currentData === undefined;
    const pDiskData = pdiskDataQuery.currentData || {};
    const {NodeHost, NodeId, NodeType, NodeDC, Severity} = pDiskData;

    const pDiskStorageQuery = pDiskApi.useGetStorageInfoQuery(params, {
        pollingInterval: DEFAULT_POLLING_INTERVAL,
    });
    const groupsLoading =
        pDiskStorageQuery.isFetching && pDiskStorageQuery.currentData === undefined;
    const groupsData = pDiskStorageQuery.currentData ?? [];

    const handleRestart = async () => {
        if (valueIsDefined(nodeId) && valueIsDefined(pDiskId)) {
            return window.api.restartPDisk(nodeId, pDiskId);
        }

        return undefined;
    };

    const handleAfterRestart = async () => {
        return Promise.all([pdiskDataQuery.refetch(), pDiskStorageQuery.refetch()]);
    };

    const renderHelmet = () => {
        const pDiskPagePart = pDiskId
            ? `${pDiskPageKeyset('pdisk')} ${pDiskId}`
            : pDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : pDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
                defaultTitle={`${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
            />
        );
    };

    const renderPageMeta = () => {
        const hostItem = NodeHost ? `${pDiskPageKeyset('fqdn')}: ${NodeHost}` : undefined;
        const nodeIdItem = NodeId ? `${pDiskPageKeyset('node')}: ${NodeId}` : undefined;

        return (
            <PageMeta
                className={pdiskPageCn('meta')}
                loading={pDiskLoading}
                items={[hostItem, nodeIdItem, NodeType, NodeDC]}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <DiskPageTitle
                entityName={pDiskPageKeyset('pdisk')}
                status={getSeverityColor(Severity)}
                id={pDiskId}
                className={pdiskPageCn('title')}
            />
        );
    };

    const renderControls = () => {
        return (
            <div className={pdiskPageCn('controls')}>
                <ButtonWithConfirmDialog
                    onConfirmAction={handleRestart}
                    onConfirmActionSuccess={handleAfterRestart}
                    buttonDisabled={!nodeId || !pDiskId}
                    buttonView="normal"
                    dialogContent={pDiskPageKeyset('restart-pdisk-dialog')}
                >
                    <Icon data={ArrowRotateLeftIcon} />
                    {pDiskPageKeyset('restart-pdisk-button')}
                </ButtonWithConfirmDialog>
            </div>
        );
    };

    const renderInfo = () => {
        if (pDiskLoading) {
            return <InfoViewerSkeleton className={pdiskPageCn('info')} rows={10} />;
        }
        return (
            <PDiskInfo
                pDisk={pDiskData}
                nodeId={nodeId}
                className={pdiskPageCn('info')}
                isPDiskPage
            />
        );
    };

    const renderGroupsTable = () => {
        return <PDiskGroups data={groupsData} nodesMap={nodesMap} loading={groupsLoading} />;
    };

    return (
        <div className={pdiskPageCn(null)}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderInfo()}
            {renderGroupsTable()}
        </div>
    );
}
