import React from 'react';

import {ArrowsOppositeToDots} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {api} from '../../store/reducers/api';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {useDiskPagesAvailable} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {getSeverityColor, getVDiskSlotBasedId} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {vDiskPageKeyset} from './i18n';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

export function VDiskPage() {
    const dispatch = useTypedDispatch();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);
    const newDiskApiAvailable = useDiskPagesAvailable();

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
    const {
        currentData: vDiskData = {},
        isFetching,
        error,
    } = vDiskApi.useGetVDiskDataQuery(params, {
        pollingInterval: autoRefreshInterval,
    });
    const loading = isFetching && vDiskData === undefined;
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
            return (
                newDiskApiAvailable ? window.api.vdisk.evictVDisk : window.api.tablets.evictVDiskOld
            )({
                groupId: GroupID,
                groupGeneration: GroupGeneration,
                failRealmIdx: Ring,
                failDomainIdx: Domain,
                vDiskIdx: VDisk,
                force: isRetry,
            }).then((response) => {
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

    const handleAfterEvictVDisk = () => {
        dispatch(
            api.util.invalidateTags([
                {
                    type: 'VDiskData',
                    id: getVDiskSlotBasedId(nodeId || 0, pDiskId || 0, vDiskSlotId || 0),
                },
                'StorageData',
            ]),
        );
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
            <PageMetaWithAutorefresh
                className={vDiskPageCn('meta')}
                loading={loading}
                items={[hostItem, nodeIdItem, NodeType, NodeDC, pDiskIdItem, PDiskType]}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <EntityPageTitle
                className={vDiskPageCn('title')}
                entityName={vDiskPageKeyset('vdisk')}
                status={getSeverityColor(Severity)}
                id={vDiskData?.StringifiedId}
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
                    dialogHeader={vDiskPageKeyset('evict-vdisk-dialog-header')}
                    dialogText={vDiskPageKeyset('evict-vdisk-dialog-text')}
                    retryButtonText={vDiskPageKeyset('force-evict-vdisk-button')}
                    withPopover
                    popoverContent={vDiskPageKeyset('evict-vdisk-not-allowed')}
                    popoverDisabled={isUserAllowedToMakeChanges}
                >
                    <Icon data={ArrowsOppositeToDots} />
                    {vDiskPageKeyset('evict-vdisk-button')}
                </ButtonWithConfirmDialog>
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo data={vDiskData} className={vDiskPageCn('info')} />;
    };

    const renderStorageInfo = () => {
        if (valueIsDefined(GroupID) && valueIsDefined(nodeId)) {
            return (
                <React.Fragment>
                    <div className={vDiskPageCn('storage-title')}>{vDiskPageKeyset('storage')}</div>
                    <PaginatedStorage
                        groupId={GroupID}
                        nodeId={nodeId}
                        pDiskId={pDiskId ?? undefined}
                        parentRef={containerRef}
                        viewContext={{
                            groupId: GroupID?.toString(),
                            nodeId: nodeId?.toString(),
                            pDiskId: pDiskId?.toString(),
                            vDiskSlotId: vDiskSlotId?.toString(),
                        }}
                    />
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
                {renderStorageInfo()}
            </React.Fragment>
        );
    };

    return (
        <div className={vDiskPageCn(null)} ref={containerRef}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderContent()}
        </div>
    );
}
