import React from 'react';

import {ArrowsOppositeToDots} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {DiskPageTitle} from '../../components/DiskPageTitle/DiskPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {GroupInfo} from '../../components/GroupInfo/GroupInfo';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {PageMeta} from '../../components/PageMeta/PageMeta';
import {VDiskWithDonorsStack} from '../../components/VDisk/VDiskWithDonorsStack';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {getSeverityColor} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {vDiskPageKeyset} from './i18n';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

export function VDiskPage() {
    const dispatch = useTypedDispatch();

    const nodesMap = useTypedSelector(selectNodesMap);
    const {isUserAllowedToMakeChanges} = useTypedSelector((state) => state.authentication);

    const [{nodeId, pDiskId, vDiskSlotId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
        vDiskSlotId: StringParam,
    });

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('vDisk', {nodeId, pDiskId, vDiskSlotId}));
    }, [dispatch, nodeId, pDiskId, vDiskSlotId]);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const params =
        valueIsDefined(nodeId) && valueIsDefined(pDiskId) && valueIsDefined(vDiskSlotId)
            ? {nodeId, pDiskId, vDiskSlotId}
            : skipToken;
    const {currentData, isFetching, refetch, error} = vDiskApi.useGetVDiskDataQuery(params, {
        pollingInterval: autoRefreshInterval,
    });
    const loading = isFetching && currentData === undefined;
    const {vDiskData = {}, groupData} = currentData || {};
    const {NodeHost, NodeId, NodeType, NodeDC, PDiskId, PDiskType, Severity, VDiskId} = vDiskData;
    const {GroupID, GroupGeneration, Ring, Domain, VDisk} = VDiskId || {};
    const vDiskIdParamsDefined =
        valueIsDefined(GroupID) &&
        valueIsDefined(GroupGeneration) &&
        valueIsDefined(Ring) &&
        valueIsDefined(Domain) &&
        valueIsDefined(VDisk);

    const handleEvictVDisk = async (isRetry?: boolean) => {
        if (vDiskIdParamsDefined) {
            return window.api
                .evictVDisk({
                    groupId: GroupID,
                    groupGeneration: GroupGeneration,
                    failRealmIdx: Ring,
                    failDomainIdx: Domain,
                    vDiskIdx: VDisk,
                    force: isRetry,
                })
                .then((response) => {
                    if (response?.result === false) {
                        const err = {
                            statusText: response.error,
                            retryPossible: response.forceRetryPossible,
                        };
                        throw err;
                    }
                });
        }

        return undefined;
    };

    const handleAfterEvictVDisk = async () => {
        return refetch();
    };

    const renderHelmet = () => {
        const vDiskPagePart = vDiskSlotId
            ? `${vDiskPageKeyset('vdisk')} ${vDiskSlotId}`
            : vDiskPageKeyset('vdisk');

        const pDiskPagePart = pDiskId
            ? `${vDiskPageKeyset('pdisk')} ${pDiskId}`
            : vDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : vDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
                defaultTitle={`${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
            />
        );
    };

    const renderPageMeta = () => {
        const hostItem = NodeHost ? `${vDiskPageKeyset('fqdn')}: ${NodeHost}` : undefined;
        const nodeIdItem = NodeId ? `${vDiskPageKeyset('node')}: ${NodeId}` : undefined;
        const pDiskIdItem = NodeId ? `${vDiskPageKeyset('pdisk')}: ${PDiskId}` : undefined;

        return (
            <PageMeta
                loading={loading}
                items={[hostItem, nodeIdItem, NodeType, NodeDC, pDiskIdItem, PDiskType]}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <DiskPageTitle
                entityName={vDiskPageKeyset('vdisk')}
                status={getSeverityColor(Severity)}
                id={stringifyVdiskId(vDiskData?.VDiskId)}
            />
        );
    };

    const renderControls = () => {
        return (
            <div className={vDiskPageCn('controls')}>
                <ButtonWithConfirmDialog
                    onConfirmAction={handleEvictVDisk}
                    onConfirmActionSuccess={handleAfterEvictVDisk}
                    buttonDisabled={!vDiskIdParamsDefined || !isUserAllowedToMakeChanges}
                    buttonView="normal"
                    dialogContent={vDiskPageKeyset('evict-vdisk-dialog')}
                    retryButtonText={vDiskPageKeyset('force-evict-vdisk-button')}
                    withPopover
                    popoverContent={vDiskPageKeyset('evict-vdisk-not-allowed')}
                    popoverDisabled={isUserAllowedToMakeChanges}
                >
                    <Icon data={ArrowsOppositeToDots} />
                    {vDiskPageKeyset('evict-vdisk-button')}
                </ButtonWithConfirmDialog>
                <AutoRefreshControl className={vDiskPageCn('auto-refresh-control')} />
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo data={vDiskData} isVDiskPage />;
    };

    const renderGroupInfo = () => {
        if (groupData) {
            return (
                <React.Fragment>
                    <div className={vDiskPageCn('group-title')}>{vDiskPageKeyset('group')}</div>
                    <GroupInfo data={groupData} />
                    <div className={vDiskPageCn('group-disks')}>
                        {groupData.VDisks?.map((vDisk) => {
                            return (
                                <VDiskWithDonorsStack
                                    key={stringifyVdiskId(vDisk.VDiskId)}
                                    data={vDisk}
                                    nodes={nodesMap}
                                    className={vDiskPageCn('group-disk')}
                                />
                            );
                        })}
                    </div>
                </React.Fragment>
            );
        }

        return null;
    };

    const renderContent = () => {
        if (loading) {
            return <InfoViewerSkeleton rows={20} />;
        }

        return (
            <React.Fragment>
                {error ? <ResponseError error={error} /> : null}
                {renderInfo()}
                {renderGroupInfo()}
            </React.Fragment>
        );
    };

    return (
        <div className={vDiskPageCn(null)}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderContent()}
        </div>
    );
}
