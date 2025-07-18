import React from 'react';

import {ArrowsOppositeToDots} from '@gravity-ui/icons';
import {Icon, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink/InternalLink';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {getVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useDiskPagesAvailable} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';
import type {ModifyDiskResponse} from '../../types/api/modifyDisk';
import type {TVDiskID} from '../../types/api/vdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {getSeverityColor, getVDiskSlotBasedId} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useAppTitle} from '../App/AppTitleContext';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {VDiskTablets} from './VDiskTablets';
import {vDiskPageKeyset} from './i18n';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

const VDISK_TABS_IDS = {
    storage: 'storage',
    tablets: 'tablets',
} as const;

const VDISK_PAGE_TABS = [
    {
        id: VDISK_TABS_IDS.storage,
        get title() {
            return vDiskPageKeyset('storage');
        },
    },
    {
        id: VDISK_TABS_IDS.tablets,
        get title() {
            return vDiskPageKeyset('tablets');
        },
    },
];

const vDiskTabSchema = z.nativeEnum(VDISK_TABS_IDS).catch(VDISK_TABS_IDS.storage);

export function VDiskPage() {
    const dispatch = useTypedDispatch();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const newDiskApiAvailable = useDiskPagesAvailable();

    const [{nodeId, pDiskId, vDiskSlotId, vDiskId: vDiskIdParam, activeTab}] = useQueryParams({
        nodeId: StringParam,
        pDiskId: StringParam,
        vDiskSlotId: StringParam,
        vDiskId: StringParam,
        activeTab: StringParam,
    });

    const vDiskTab = vDiskTabSchema.parse(activeTab);

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('vDisk', {nodeId, pDiskId, vDiskSlotId}));
    }, [dispatch, nodeId, pDiskId, vDiskSlotId]);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const params =
        valueIsDefined(nodeId) && valueIsDefined(pDiskId) && valueIsDefined(vDiskSlotId)
            ? {nodeId, pDiskId, vDiskSlotId}
            : skipToken;
    const {
        currentData: vDiskData,
        isFetching,
        error,
    } = vDiskApi.useGetVDiskDataQuery(params, {
        pollingInterval: autoRefreshInterval,
    });
    const loading = isFetching && vDiskData === undefined;
    const {NodeHost, NodeId, NodeType, NodeDC, PDiskId, PDiskType, Severity, VDiskId} =
        vDiskData || {};

    const {GroupID, GroupGeneration, Ring, Domain, VDisk} =
        VDiskId || (!loading && getVDiskIdFromString(vDiskIdParam)) || {};
    const vDiskIdParamsDefined =
        valueIsDefined(GroupID) &&
        valueIsDefined(GroupGeneration) &&
        valueIsDefined(Ring) &&
        valueIsDefined(Domain) &&
        valueIsDefined(VDisk);

    const handleEvictVDisk = async (isRetry?: boolean) => {
        if (vDiskIdParamsDefined) {
            const requestParams = {
                groupId: GroupID,
                groupGeneration: GroupGeneration,
                failRealmIdx: Ring,
                failDomainIdx: Domain,
                vDiskIdx: VDisk,
                force: isRetry,
            };

            let response: ModifyDiskResponse;

            if (newDiskApiAvailable) {
                response = await window.api.vdisk.evictVDisk(requestParams);
            } else {
                response = await window.api.tablets.evictVDiskOld(requestParams);
            }

            if (response?.result === false) {
                const err = {
                    statusText: response.error,
                    retryPossible: response.forceRetryPossible,
                };
                throw err;
            }
        }
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

    const {appTitle} = useAppTitle();

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
                titleTemplate={`%s - ${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
                defaultTitle={`${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
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
                id={vDiskData?.StringifiedId || (!loading && vDiskIdParam)}
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
        return <VDiskInfo data={vDiskData} className={vDiskPageCn('info')} wrap />;
    };

    const renderTabs = () => {
        const vDiskParamsDefined =
            valueIsDefined(nodeId) && valueIsDefined(pDiskId) && valueIsDefined(vDiskSlotId);

        return (
            <div className={vDiskPageCn('tabs')}>
                <TabProvider value={vDiskTab}>
                    <TabList size="l">
                        {VDISK_PAGE_TABS.map(({id, title}) => {
                            const path = vDiskParamsDefined
                                ? getVDiskPagePath({nodeId, pDiskId, vDiskSlotId}, {activeTab: id})
                                : undefined;
                            return (
                                <Tab key={id} value={id}>
                                    <InternalLink as="tab" to={path}>
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>
            </div>
        );
    };

    const renderTabsContent = () => {
        switch (vDiskTab) {
            case 'storage': {
                return renderStorageInfo();
            }
            case 'tablets': {
                return (
                    <VDiskTablets
                        nodeId={nodeId ?? undefined}
                        pDiskId={pDiskId ?? undefined}
                        vDiskSlotId={vDiskSlotId ?? undefined}
                        className={vDiskPageCn('tablets-content')}
                    />
                );
            }
            default:
                return null;
        }
    };

    const renderStorageInfo = () => {
        if (valueIsDefined(GroupID) && valueIsDefined(nodeId)) {
            return (
                <PaginatedStorage
                    groupId={GroupID}
                    nodeId={nodeId}
                    pDiskId={pDiskId ?? undefined}
                    scrollContainerRef={containerRef}
                    viewContext={{
                        groupId: GroupID?.toString(),
                        nodeId: nodeId?.toString(),
                        pDiskId: pDiskId?.toString(),
                        vDiskSlotId: vDiskSlotId?.toString(),
                    }}
                />
            );
        }

        return null;
    };

    const renderContent = () => {
        if (loading) {
            return <InfoViewerSkeleton rows={9} />;
        }

        return (
            <React.Fragment>
                {error ? <ResponseError error={error} /> : null}
                {renderInfo()}
                {renderTabs()}
                {renderTabsContent()}
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

function getVDiskIdFromString(input: string | null | undefined): TVDiskID | undefined {
    const match = /^(\d+)-(\d+)-(\d+)-(\d+)-(\d+)$/.exec(input ?? '');
    if (!match) {
        return undefined;
    }

    const [, GroupID, GroupGeneration, Ring, Domain, VDisk] = match;
    return {
        GroupID: Number(GroupID),
        GroupGeneration: Number(GroupGeneration),
        Ring: Number(Ring),
        Domain: Number(Domain),
        VDisk: Number(VDisk),
    };
}
