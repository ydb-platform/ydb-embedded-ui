import {useCallback, useEffect} from 'react';
import {StringParam, useQueryParams} from 'use-query-params';
import {Helmet} from 'react-helmet-async';

import {Icon} from '@gravity-ui/uikit';
import ArrowRotateLeftIcon from '@gravity-ui/icons/svgs/arrow-rotate-left.svg';

import {
    getPDiskData,
    getPDiskStorage,
    setPDiskDataWasNotLoaded,
} from '../../store/reducers/pdisk/pdisk';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';

import {valueIsDefined} from '../../utils';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {getSeverityColor} from '../../utils/disks/helpers';

import {PageMeta} from '../../components/PageMeta/PageMeta';
import {PDiskInfo} from '../../components/PDiskInfo/PDiskInfo';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {DiskPageTitle} from '../../components/DiskPageTitle/DiskPageTitle';
import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';

import {useClusterNodesMap} from '../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

import {PDiskGroups} from './PDiskGroups';
import {pdiskPageCn} from './shared';
import {pDiskPageKeyset} from './i18n';

import './PDiskPage.scss';

export function PDiskPage() {
    const dispatch = useTypedDispatch();

    const nodesMap = useClusterNodesMap();
    const {pDiskData, groupsData, pDiskLoading, pDiskWasLoaded, groupsLoading, groupsWasLoaded} =
        useTypedSelector((state) => state.pDisk);
    const {NodeHost, NodeId, NodeType, NodeDC, Severity} = pDiskData;

    const [{nodeId, pDiskId}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
    });

    useEffect(() => {
        dispatch(setHeaderBreadcrumbs('pDisk', {nodeId, pDiskId}));
    }, [dispatch, nodeId, pDiskId]);

    const fetchData = useCallback(
        async (isBackground?: boolean) => {
            if (!isBackground) {
                dispatch(setPDiskDataWasNotLoaded());
            }

            if (valueIsDefined(nodeId) && valueIsDefined(pDiskId)) {
                return Promise.all([
                    dispatch(getPDiskData({nodeId, pDiskId})),
                    dispatch(getPDiskStorage({nodeId, pDiskId})),
                ]);
            }

            return undefined;
        },
        [dispatch, nodeId, pDiskId],
    );

    useAutofetcher(fetchData, [fetchData], true);

    const handleRestart = async () => {
        if (valueIsDefined(nodeId) && valueIsDefined(pDiskId)) {
            return window.api.restartPDisk(nodeId, pDiskId);
        }

        return undefined;
    };

    const handleAfterRestart = async () => {
        return fetchData(true);
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
                loading={pDiskLoading && !pDiskWasLoaded}
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
        if (pDiskLoading && !pDiskWasLoaded) {
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
        return (
            <PDiskGroups
                data={groupsData}
                nodesMap={nodesMap}
                loading={groupsLoading && !groupsWasLoaded}
            />
        );
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
