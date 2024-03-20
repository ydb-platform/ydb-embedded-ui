import {useCallback, useEffect} from 'react';
import {StringParam, useQueryParams} from 'use-query-params';
import {Helmet} from 'react-helmet-async';

import {Icon} from '@gravity-ui/uikit';
import ArrowsOppositeToDotsIcon from '@gravity-ui/icons/svgs/arrows-opposite-to-dots.svg';

import {cn} from '../../utils/cn';
import {getSeverityColor} from '../../utils/disks/helpers';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {valueIsDefined} from '../../utils';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {getVDiskData, setVDiskDataWasNotLoaded} from '../../store/reducers/vdisk/vdisk';

import {PageMeta} from '../../components/PageMeta/PageMeta';
import {DiskPageTitle} from '../../components/DiskPageTitle/DiskPageTitle';
import {GroupInfo} from '../../components/GroupInfo/GroupInfo';
import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {VDiskWithDonorsStack} from '../../components/VDisk/VDiskWithDonorsStack';

import {useClusterNodesMap} from '../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

import {vDiskPageKeyset} from './i18n';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

export function VDiskPage() {
    const dispatch = useTypedDispatch();

    const nodesMap = useClusterNodesMap();
    const {vDiskData, groupData, loading, wasLoaded} = useTypedSelector((state) => state.vDisk);
    const {NodeHost, NodeId, NodeType, NodeDC, PDiskId, PDiskType, Severity, VDiskId} = vDiskData;

    const [{nodeId, pDiskId, vDiskSlotId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
        vDiskSlotId: StringParam,
    });

    useEffect(() => {
        dispatch(setHeaderBreadcrumbs('vDisk', {nodeId, pDiskId, vDiskSlotId}));
    }, [dispatch, nodeId, pDiskId, vDiskSlotId]);

    const fetchData = useCallback(
        async (isBackground?: boolean) => {
            if (!isBackground) {
                dispatch(setVDiskDataWasNotLoaded());
            }
            if (valueIsDefined(nodeId) && valueIsDefined(pDiskId) && valueIsDefined(vDiskSlotId)) {
                return dispatch(getVDiskData({nodeId, pDiskId, vDiskSlotId}));
            }
            return undefined;
        },
        [dispatch, nodeId, pDiskId, vDiskSlotId],
    );

    useAutofetcher(fetchData, [fetchData], true);

    const handleEvictVDisk = async () => {
        const {GroupID, GroupGeneration, Ring, Domain, VDisk} = VDiskId || {};

        if (
            valueIsDefined(GroupID) &&
            valueIsDefined(GroupGeneration) &&
            valueIsDefined(Ring) &&
            valueIsDefined(Domain) &&
            valueIsDefined(VDisk)
        ) {
            return window.api.evictVDisk({
                groupId: GroupID,
                groupGeneration: GroupGeneration,
                failRealmIdx: Ring,
                failDomainIdx: Domain,
                vDiskIdx: VDisk,
            });
        }

        return undefined;
    };

    const handleAfterEvictVDisk = async () => {
        return fetchData(true);
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
                loading={loading && !wasLoaded}
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
            <div>
                <ButtonWithConfirmDialog
                    onConfirmAction={handleEvictVDisk}
                    onConfirmActionSuccess={handleAfterEvictVDisk}
                    buttonDisabled={!VDiskId}
                    buttonView="normal"
                    dialogContent={vDiskPageKeyset('evict-vdisk-dialog')}
                >
                    <Icon data={ArrowsOppositeToDotsIcon} />
                    {vDiskPageKeyset('evict-vdisk-button')}
                </ButtonWithConfirmDialog>
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo data={vDiskData} isVDiskPage />;
    };

    const renderGroupInfo = () => {
        if (groupData) {
            return (
                <>
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
                </>
            );
        }

        return null;
    };

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return <InfoViewerSkeleton rows={20} />;
        }

        return (
            <>
                {renderInfo()}
                {renderGroupInfo()}
            </>
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
